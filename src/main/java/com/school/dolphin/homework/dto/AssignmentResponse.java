package com.school.dolphin.homework.dto;

import com.school.dolphin.homework.entity.Assignment;
import com.school.dolphin.homework.entity.AssignmentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AssignmentResponse(
        UUID id,
        UUID institutionId,
        UUID sectionId,
        UUID createdByStaffId,
        String title,
        String instructions,
        OffsetDateTime dueAt,
        BigDecimal maxMarks,
        AssignmentStatus status,
        OffsetDateTime publishedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Long version
) {
    public static AssignmentResponse from(Assignment assignment) {
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getInstitution().getId(),
                assignment.getSection().getId(),
                assignment.getCreatedBy().getId(),
                assignment.getTitle(),
                assignment.getInstructions(),
                assignment.getDueAt(),
                assignment.getMaxMarks(),
                assignment.getStatus(),
                assignment.getPublishedAt(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt(),
                assignment.getVersion()
        );
    }
}
