
package com.school.dolphin.staff.controller;

import com.school.dolphin.staff.dto.*;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.service.StaffManagementService;

import com.school.dolphin.staff.service.TeacherOnboardingService;
import jakarta.validation.Valid;

import lombok.AllArgsConstructor;
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
@RequestMapping("/api/v1/staff")
@AllArgsConstructor
public class StaffController {

    private final StaffManagementService staffManagementService;
    private final TeacherOnboardingService teacherOnboardingService;


    @PostMapping
    @PreAuthorize("hasAuthority('STAFF_CREATE')")
    public StaffAssignmentResponse createStaff(
            @Valid @RequestBody CreateStaffRequest request,
            Authentication authentication
    ) {
        return staffManagementService.createStaff(
                request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('STAFF_READ')")
    public Page<StaffAssignmentResponse> getStaffByInstitution(
            @RequestParam UUID institutionId,
            @RequestParam(defaultValue = "ACTIVE")
            StaffAssignmentStatus status,
            @PageableDefault(
                    size = 20,
                    sort = "employeeNumber",
                    direction = Sort.Direction.ASC
            ) Pageable pageable,
            Authentication authentication
    ) {
        return staffManagementService.getStaffByInstitution(
                institutionId, status, pageable, authentication);
    }

    @PatchMapping("/assignments/{assignmentId}/status")
    @PreAuthorize("hasAuthority('STAFF_UPDATE')")
    public StaffAssignmentResponse updateAssignmentStatus(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody UpdateStaffAssignmentStatusRequest request,
            Authentication authentication
    ) {
        return staffManagementService.updateAssignmentStatus(
                assignmentId, request, authentication);
    }

    @PostMapping("/onboard-teacher")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(
            "hasAuthority('STAFF_CREATE') and " +
                    "hasAuthority('USER_INVITATION_CREATE')"
    )
    public TeacherOnboardingResponse onboardTeacher(
            @Valid @RequestBody OnboardTeacherRequest request,
            Authentication authentication
    ) {
        return teacherOnboardingService.onboardTeacher(
                request,
                authentication
        );
    }
}