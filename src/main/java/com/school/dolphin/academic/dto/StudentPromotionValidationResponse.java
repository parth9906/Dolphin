package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.PromotionBatchStatus;

import java.util.List;
import java.util.UUID;

public record StudentPromotionValidationResponse(
        UUID batchId,
        PromotionBatchStatus status,
        boolean readyToExecute,
        long totalStudents,
        long pendingCount,
        long promoteCount,
        long holdBackCount,
        long withdrawCount,
        long excludeCount,
        List<String> blockingIssues
) {
}