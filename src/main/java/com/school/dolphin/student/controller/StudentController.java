package com.school.dolphin.student.controller;

import com.school.dolphin.student.dto.CreateStudentRequest;
import com.school.dolphin.student.dto.StudentResponse;
import com.school.dolphin.student.dto.UpdateStudentRequest;
import com.school.dolphin.student.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('STUDENT_CREATE')")
    public StudentResponse createStudent(
            @Valid @RequestBody CreateStudentRequest request,
            Authentication authentication
    ) {
        return studentService.createStudent(request, authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    public StudentResponse getStudent(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return studentService.getStudent(id, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    public Page<StudentResponse> searchStudents(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) String search,
            @PageableDefault(
                    size = 20,
                    sort = "firstName",
                    direction = Sort.Direction.ASC
            ) Pageable pageable,
            Authentication authentication
    ) {
        return studentService.searchStudents(
                institutionId,
                campusId,
                search,
                pageable,
                authentication
        );
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('STUDENT_UPDATE')")
    public StudentResponse updateStudent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStudentRequest request,
            Authentication authentication
    ) {
        return studentService.updateStudent(id, request, authentication);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('STUDENT_DEACTIVATE')")
    public StudentResponse deactivateStudent(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return studentService.deactivateStudent(id, authentication);
    }
}