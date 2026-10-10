package com.school.dolphin.staff.dto;

import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffType;

import java.time.LocalDate;
import java.util.UUID;

public record StaffAssignmentResponse(
        UUID staffMemberId,
        UUID assignmentId,
        UUID institutionId,
        UUID campusId,
        UUID userAccountId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String employeeNumber,
        StaffType staffType,
        String jobTitle,
        LocalDate startDate,
        LocalDate endDate,
        StaffAssignmentStatus status
) {}