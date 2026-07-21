package com.example.ckclasses.ui.teachers

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.data.repository.TeacherRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class TeacherViewModel(
    private val repository: TeacherRepository = TeacherRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _teachersState = MutableLiveData<NetworkResult<List<Teacher>>>()
    val teachersState: LiveData<NetworkResult<List<Teacher>>> = _teachersState

    fun loadTeachers() {
        _teachersState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _teachersState.value = repository.getTeachers()
        }
    }
}
