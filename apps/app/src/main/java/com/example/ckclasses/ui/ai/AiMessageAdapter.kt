package com.example.ckclasses.ui.ai

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.AiMessage
import com.example.ckclasses.databinding.ItemAiMessageBotBinding
import com.example.ckclasses.databinding.ItemAiMessageUserBinding

class AiMessageAdapter(
    private val messages: MutableList<AiMessage> = mutableListOf()
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_USER = 1
        private const val TYPE_BOT = 2
    }

    fun addMessage(message: AiMessage) {
        messages.add(message)
        notifyItemInserted(messages.size - 1)
    }

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isUser) TYPE_USER else TYPE_BOT
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == TYPE_USER) {
            val binding = ItemAiMessageUserBinding.inflate(inflater, parent, false)
            UserViewHolder(binding)
        } else {
            val binding = ItemAiMessageBotBinding.inflate(inflater, parent, false)
            BotViewHolder(binding)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = messages[position]
        if (holder is UserViewHolder) holder.bind(msg)
        else if (holder is BotViewHolder) holder.bind(msg)
    }

    override fun getItemCount(): Int = messages.size

    class UserViewHolder(private val binding: ItemAiMessageUserBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: AiMessage) {
            binding.tvMessageUser.text = item.text
        }
    }

    class BotViewHolder(private val binding: ItemAiMessageBotBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: AiMessage) {
            binding.tvMessageBot.text = item.text
        }
    }
}
