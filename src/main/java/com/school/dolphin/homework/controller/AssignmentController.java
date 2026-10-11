package com.school.dolphin.homework.controller;

import com.school.dolphin.homework.dto.AssignmentResponse;
import com.school.dolphin.homework.dto.CreateAssignmentRequest;
import com.school.dolphin.homework.dto.UpdateAssignmentRequest;
import com.school.dolphin.homework.entity.AssignmentStatus;
import com.school.dolphin.homework.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public AssignmentResponse create(
            @Valid @RequestBody CreateAssignmentRequest request,
            Authentication authentication
    ) {
        return assignmentService.create(request, authentication);
    }

    @GetMapping("/{assignmentId}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public AssignmentResponse getById(
            @PathVariable UUID assignmentId,
            Authentication authentication
    ) {
        return assignmentService.getById(assignmentId, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public Page<AssignmentResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID sectionId,
            @RequestParam(required = false) AssignmentStatus status,
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable,
            Authentication authentication
    ) {
        return assignmentService.search(
                institutionId, sectionId, status, pageable, authentication);
    }

    @PatchMapping("/{assignmentId}")
    @PreAuthorize("hasAuthority('ASSIGNMENT_UPDATE')")
    public AssignmentResponse updateDraft(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody UpdateAssignmentRequest request,
            Authentication authentication
    ) {
        return assignmentService.updateDraft(
                assignmentId, request, authentication);
    }

    @PostMapping("/{assignmentId}/publish")
    @PreAuthorize("hasAuthority('ASSIGNMENT_PUBLISH')")
    public AssignmentResponse publish(
            @PathVariable UUID assignmentId,
            Authentication authentication
    ) {
        return assignmentService.publish(assignmentId, authentication);
    }
}