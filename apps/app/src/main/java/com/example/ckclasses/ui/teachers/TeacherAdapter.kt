package com.example.ckclasses.ui.teachers

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.databinding.ItemTeacherBinding

class TeacherAdapter(
    private val onEditClick: ((Teacher) -> Unit)? = null
) : ListAdapter<Teacher, TeacherAdapter.TeacherViewHolder>(TeacherDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TeacherViewHolder {
        val binding = ItemTeacherBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return TeacherViewHolder(binding, onEditClick)
    }

    override fun onBindViewHolder(holder: TeacherViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class TeacherViewHolder(
        private val binding: ItemTeacherBinding,
        private val onEditClick: ((Teacher) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(teacher: Teacher) {
            binding.tvTeacherId.text = if (teacher.teacherId.isNotEmpty()) teacher.teacherId else teacher.id.takeLast(8).uppercase()
            binding.tvTeacherName.text = teacher.fullName
            binding.tvTeacherEmail.text = teacher.email ?: "No email provided"
            binding.tvTeacherSubject.text = if (teacher.subjectsHandled.isNotEmpty()) teacher.subjectsHandled.joinToString(", ") else if (teacher.department.isNotEmpty()) teacher.department else "General Educator"
            binding.tvTeacherPhone.text = if (!teacher.phone.isNullOrEmpty()) "📞 ${teacher.phone}" else "📞 N/A"
            binding.tvTeacherStatus.text = teacher.status

            val initial = if (teacher.fullName.isNotEmpty()) teacher.fullName[0].toString().uppercase() else "T"
            binding.tvTeacherAvatar.text = initial

            binding.btnEditTeacher.setOnClickListener {
                onEditClick?.invoke(teacher)
            }
        }
    }

    class TeacherDiffCallback : DiffUtil.ItemCallback<Teacher>() {
        override fun areItemsTheSame(oldItem: Teacher, newItem: Teacher): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Teacher, newItem: Teacher): Boolean = oldItem == newItem
    }
}
