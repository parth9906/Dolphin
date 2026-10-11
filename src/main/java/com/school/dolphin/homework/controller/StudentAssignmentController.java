package com.school.dolphin.homework.controller;

import com.school.dolphin.homework.dto.AssignmentResponse;
import com.school.dolphin.homework.dto.AssignmentSubmissionResponse;
import com.school.dolphin.homework.dto.SubmitAssignmentRequest;
import com.school.dolphin.homework.service.StudentAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student-portal/assignments")
@RequiredArgsConstructor
public class StudentAssignmentController {

    private final StudentAssignmentService studentAssignmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public Page<AssignmentResponse> listAvailableAssignments(
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable,
            Authentication authentication
    ) {
        return studentAssignmentService.listAvailableAssignments(
                authentication, pageable);
    }

    @PostMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasAuthority('ASSIGNMENT_SUBMISSION_CREATE')")
    public AssignmentSubmissionResponse submit(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody SubmitAssignmentRequest request,
            Authentication authentication
    ) {
        return studentAssignmentService.submit(
                assignmentId, request, authentication);
    }

    @GetMapping("/{assignmentId}/submissions/me")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public AssignmentSubmissionResponse getMySubmission(
            @PathVariable UUID assignmentId,
            Authentication authentication
    ) {
        return studentAssignmentService.getMySubmission(
                assignmentId, authentication);
    }
}