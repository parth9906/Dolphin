package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.StudentPromotionDecision;

import java.util.UUID;

public record StudentPromotionItemResponse(
        UUID id,
        UUID studentId,
        String admissionNumber,
        String studentName,

        UUID sourceEnrollmentId,
        UUID sourceSectionId,
        String sourceSectionName,
        UUID sourceClassId,
        String sourceClassName,

        StudentPromotionDecision decision,
        UUID targetSectionId,
        String targetSectionName,
        UUID targetClassId,
        String targetClassName,

        String reason,
        UUID targetEnrollmentId
) {
}