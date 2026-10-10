
package com.school.dolphin.academic.controller;

import com.school.dolphin.academic.dto.AcademicSubjectResponse;
import com.school.dolphin.academic.dto.AssignTeacherSubjectRequest;
import com.school.dolphin.academic.dto.CreateAcademicSubjectRequest;
import com.school.dolphin.academic.dto.TeacherSubjectAssignmentResponse;
import com.school.dolphin.academic.service.TeacherSubjectService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class TeacherSubjectController {

    private final TeacherSubjectService teacherSubjectService;

    public TeacherSubjectController(
            TeacherSubjectService teacherSubjectService
    ) {
        this.teacherSubjectService = teacherSubjectService;
    }

    @PostMapping("/subjects")
    @PreAuthorize("hasAuthority('SUBJECT_CREATE')")
    public AcademicSubjectResponse createSubject(
            @Valid @RequestBody CreateAcademicSubjectRequest request,
            Authentication authentication
    ) {
        return teacherSubjectService.createSubject(
                request, authentication);
    }

    @GetMapping("/subjects")
    @PreAuthorize("hasAuthority('SUBJECT_READ')")
    public List<AcademicSubjectResponse> getSubjects(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return teacherSubjectService.getSubjects(
                institutionId, authentication);
    }

    @PostMapping("/teacher-subject-assignments")
    @PreAuthorize("hasAuthority('TEACHER_SUBJECT_ASSIGN')")
    public TeacherSubjectAssignmentResponse assignTeacher(
            @Valid @RequestBody AssignTeacherSubjectRequest request,
            Authentication authentication
    ) {
        return teacherSubjectService.assignTeacher(
                request, authentication);
    }

    @GetMapping("/teacher-subject-assignments")
    @PreAuthorize("hasAuthority('TEACHER_SUBJECT_READ')")
    public List<TeacherSubjectAssignmentResponse> getAssignments(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return teacherSubjectService.getAssignments(
                institutionId, authentication);
    }

    @PatchMapping("/teacher-subject-assignments/{assignmentId}/end")
    @PreAuthorize("hasAuthority('TEACHER_SUBJECT_ASSIGN')")
    public TeacherSubjectAssignmentResponse endAssignment(
            @PathVariable UUID assignmentId,
            @RequestParam
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate endDate,
            Authentication authentication
    ) {
        return teacherSubjectService.endAssignment(
                assignmentId, endDate, authentication);
    }
}