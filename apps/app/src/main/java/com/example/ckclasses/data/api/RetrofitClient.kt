package com.example.ckclasses.data.api

import android.content.Context
import android.util.Log
import com.example.ckclasses.utils.Constants
import com.example.ckclasses.utils.SessionManager
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    private const val TAG = "RetrofitClient"

    val cookieJar = MemoryCookieJar()
    var authToken: String? = null
    var appContext: Context? = null

    fun init(context: Context) {
        appContext = context.applicationContext
        val savedToken = SessionManager(context).getAuthToken()
        if (!savedToken.isNullOrEmpty()) {
            authToken = savedToken
            Log.d(TAG, "Restored auth token from SharedPreferences (${savedToken.take(20)}...)")
        } else {
            Log.w(TAG, "No saved auth token found in SharedPreferences")
        }
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()

        // Always read the latest token
        val token = authToken ?: appContext?.let { SessionManager(it).getAuthToken() }
        if (!token.isNullOrEmpty()) {
            builder.header("Authorization", "Bearer $token")
        } else {
            Log.w(TAG, "No auth token available for request: ${original.url}")
        }
        chain.proceed(builder.build())
    }

    // Authenticator handles 401 responses by trying to refresh the token
    private val tokenAuthenticator = Authenticator { _: Route?, response: Response ->
        // Only retry once to avoid infinite loops
        if (response.request.header("X-Retry-Auth") != null) {
            Log.w(TAG, "Token refresh already attempted, giving up")
            return@Authenticator null
        }

        Log.d(TAG, "Got 401, attempting token refresh...")

        val ctx = appContext ?: return@Authenticator null

        // Try to refresh token via the refresh endpoint using cookies
        try {
            val refreshRequest = Request.Builder()
                .url(Constants.BASE_URL + "auth/refresh")
                .post(okhttp3.RequestBody.create(null, ByteArray(0)))
                .build()

            // Use a separate OkHttpClient to avoid interceptor loops
            val refreshClient = OkHttpClient.Builder()
                .cookieJar(cookieJar)
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build()

            val refreshResponse = refreshClient.newCall(refreshRequest).execute()

            if (refreshResponse.isSuccessful) {
                val body = refreshResponse.body?.string() ?: ""
                // Parse accessToken from JSON response
                val tokenRegex = """"accessToken"\s*:\s*"([^"]+)"""".toRegex()
                val match = tokenRegex.find(body)
                val newToken = match?.groupValues?.getOrNull(1)

                if (!newToken.isNullOrEmpty()) {
                    authToken = newToken
                    SessionManager(ctx).saveAuthToken(newToken)
                    Log.d(TAG, "Token refreshed successfully")

                    // Retry the original request with the new token
                    return@Authenticator response.request.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .header("X-Retry-Auth", "true")
                        .build()
                }
            }

            Log.w(TAG, "Token refresh failed with code: ${refreshResponse.code}")
        } catch (e: Exception) {
            Log.e(TAG, "Token refresh error: ${e.message}")
        }

        null // Return null to signal auth failure
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .cookieJar(cookieJar)
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .authenticator(tokenAuthenticator)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(Constants.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
