
package com.school.dolphin.student.controller;

import com.school.dolphin.student.dto.*;
import com.school.dolphin.student.service.StudentAccountLinkService;
import com.school.dolphin.student.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentService studentService;
    private final StudentAccountLinkService studentAccountLinkService;

    public StudentController(
            StudentService studentService,
            StudentAccountLinkService studentAccountLinkService
    ) {
        this.studentService = studentService;
        this.studentAccountLinkService = studentAccountLinkService;
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

    @GetMapping("/inactive")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    public Page<StudentResponse> searchInactiveStudents(
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
        return studentService.searchInactiveStudents(
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

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('STUDENT_ACTIVATE')")
    public StudentResponse activateStudent(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return studentService.activateStudent(id, authentication);
    }

    @PostMapping("/{id}/account-link")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('STUDENT_ACCOUNT_LINK')")
    public StudentAccountLinkResponse linkAccount(
            @PathVariable UUID id,
            @Valid @RequestBody LinkStudentAccountRequest request,
            Authentication authentication
    ) {
        return studentAccountLinkService.link(id, request, authentication);
    }


    @GetMapping("/{id}/account-link")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    public StudentAccountLinkDetailsResponse getAccountLink(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return studentAccountLinkService.getLink(id, authentication);
    }

}
