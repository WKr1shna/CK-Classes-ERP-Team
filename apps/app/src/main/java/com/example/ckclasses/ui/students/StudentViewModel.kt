package com.example.ckclasses.ui.students

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.data.repository.StudentRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class StudentViewModel(
    private val repository: StudentRepository = StudentRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _studentsState = MutableLiveData<NetworkResult<List<Student>>>()
    val studentsState: LiveData<NetworkResult<List<Student>>> = _studentsState

    fun loadStudents() {
        _studentsState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _studentsState.value = repository.getStudents()
        }
    }
}
