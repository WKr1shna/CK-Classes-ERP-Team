package com.example.ckclasses.ui.ai

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.AiMessage
import com.example.ckclasses.data.repository.AiRepository
import com.example.ckclasses.databinding.FragmentAiAssistantBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class AiAssistantFragment : Fragment() {

    private var _binding: FragmentAiAssistantBinding? = null
    private val binding get() = _binding!!
    private val repository = AiRepository(RetrofitClient.apiService)
    private lateinit var adapter: AiMessageAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAiAssistantBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = AiMessageAdapter()
        val layoutManager = LinearLayoutManager(requireContext()).apply {
            stackFromEnd = true
        }
        binding.rvAiMessages.layoutManager = layoutManager
        binding.rvAiMessages.adapter = adapter

        // Add welcome message
        adapter.addMessage(
            AiMessage("Hello! I am your C.K. Classes ERP AI Assistant powered by Groq Llama 3.3. How can I help you today?", isUser = false)
        )

        binding.btnSendAi.setOnClickListener {
            val text = binding.etMessage.text.toString().trim()
            if (text.isEmpty()) return@setOnClickListener

            // Add user message
            adapter.addMessage(AiMessage(text, isUser = true))
            binding.etMessage.setText("")
            binding.rvAiMessages.smoothScrollToPosition(adapter.itemCount - 1)

            binding.btnSendAi.isEnabled = false

            // Query backend AI API
            lifecycleScope.launch {
                when (val result = repository.queryAi(text)) {
                    is NetworkResult.Success -> {
                        binding.btnSendAi.isEnabled = true
                        val replyText = result.data ?: "AI response received."
                        adapter.addMessage(AiMessage(replyText, isUser = false))
                        binding.rvAiMessages.smoothScrollToPosition(adapter.itemCount - 1)
                    }
                    is NetworkResult.Error -> {
                        binding.btnSendAi.isEnabled = true
                        val errorText = result.message ?: "Could not get response from AI Assistant."
                        adapter.addMessage(AiMessage(errorText, isUser = false))
                        Toast.makeText(requireContext(), errorText, Toast.LENGTH_SHORT).show()
                    }
                    else -> binding.btnSendAi.isEnabled = true
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
