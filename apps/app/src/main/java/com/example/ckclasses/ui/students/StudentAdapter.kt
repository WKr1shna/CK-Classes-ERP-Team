package com.example.ckclasses.ui.students

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.databinding.ItemStudentBinding

class StudentAdapter(
    private val onEditClick: ((Student) -> Unit)? = null
) : ListAdapter<Student, StudentAdapter.StudentViewHolder>(StudentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val binding = ItemStudentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return StudentViewHolder(binding, onEditClick)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class StudentViewHolder(
        private val binding: ItemStudentBinding,
        private val onEditClick: ((Student) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(student: Student) {
            binding.tvStudentId.text = if (student.studentId.isNotEmpty()) student.studentId else student.id.takeLast(8).uppercase()
            binding.tvStudentName.text = student.fullName
            binding.tvStudentEmail.text = student.email ?: "No email provided"
            binding.tvStudentClass.text = if (student.studentClass.isNotEmpty()) student.studentClass else "Unassigned"
            binding.tvStudentPhone.text = if (!student.phone.isNullOrEmpty()) "📞 ${student.phone}" else "📞 N/A"
            binding.tvStudentStatus.text = student.status

            val initial = if (student.fullName.isNotEmpty()) student.fullName[0].toString().uppercase() else "S"
            binding.tvStudentAvatar.text = initial

            binding.btnEditStudent.setOnClickListener {
                onEditClick?.invoke(student)
            }
        }
    }

    class StudentDiffCallback : DiffUtil.ItemCallback<Student>() {
        override fun areItemsTheSame(oldItem: Student, newItem: Student): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Student, newItem: Student): Boolean = oldItem == newItem
    }
}
