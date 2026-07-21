package com.example.ckclasses.data.repository

import com.example.ckclasses.data.api.ApiService
import com.example.ckclasses.data.models.AiQueryRequest
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AiRepository(private val apiService: ApiService) {

    suspend fun queryAi(message: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.queryAi(AiQueryRequest(message))
            if (res.isSuccessful && res.body()?.success == true) {
                val data = res.body()?.data
                val text = data?.reply ?: data?.response ?: data?.answer ?: "AI response received."
                NetworkResult.Success(text)
            } else {
                NetworkResult.Error(res.body()?.error ?: "Failed to get AI response")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error connecting to AI Assistant")
        }
    }
}
