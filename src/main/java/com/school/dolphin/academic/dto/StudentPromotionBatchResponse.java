package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.PromotionBatchStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StudentPromotionBatchResponse(
        UUID id,
        UUID institutionId,
        UUID sourceAcademicYearId,
        String sourceAcademicYearName,
        UUID targetAcademicYearId,
        String targetAcademicYearName,
        PromotionBatchStatus status,
        long totalStudents,
        long pendingCount,
        long promoteCount,
        long holdBackCount,
        long withdrawCount,
        long excludeCount,
        OffsetDateTime createdAt,
        OffsetDateTime executedAt
) {
}