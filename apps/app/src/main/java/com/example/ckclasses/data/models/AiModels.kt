package com.example.ckclasses.data.models

import com.google.gson.annotations.SerializedName

data class AiQueryRequest(
    @SerializedName("message") val message: String
)

data class AiQueryResponseData(
    @SerializedName("reply") val reply: String? = null,
    @SerializedName("response") val response: String? = null,
    @SerializedName("answer") val answer: String? = null
)

data class AiMessage(
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)
