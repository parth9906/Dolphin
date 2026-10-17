package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.StudentPromotionDecision;

import java.util.UUID;

public record BulkStudentPromotionDecisionResponse(
        UUID batchId,
        UUID sourceSectionId,
        UUID targetSectionId,
        StudentPromotionDecision decision,
        long updatedCount,
        long skippedInactiveCount,
        long alreadyDecidedCount
) {
}