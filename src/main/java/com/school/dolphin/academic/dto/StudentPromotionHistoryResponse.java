package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.entity.PromotionBatchStatus;
import com.school.dolphin.academic.entity.StudentPromotionDecision;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StudentPromotionHistoryResponse(
        UUID batchId,
        PromotionBatchStatus batchStatus,

        UUID studentId,
        String admissionNumber,
        String studentName,

        UUID sourceAcademicYearId,
        String sourceAcademicYearName,
        UUID sourceEnrollmentId,
        LocalDate sourceEnrollmentStartDate,
        LocalDate sourceEnrollmentEndDate,
        EnrollmentStatus sourceEnrollmentStatus,
        UUID sourceClassId,
        String sourceClassName,
        UUID sourceSectionId,
        String sourceSectionName,

        StudentPromotionDecision decision,
        String reason,

        UUID targetAcademicYearId,
        String targetAcademicYearName,
        UUID targetClassId,
        String targetClassName,
        UUID targetSectionId,
        String targetSectionName,

        UUID targetEnrollmentId,
        LocalDate targetEnrollmentStartDate,
        LocalDate targetEnrollmentEndDate,
        EnrollmentStatus targetEnrollmentStatus,

        OffsetDateTime batchCreatedAt,
        OffsetDateTime batchExecutedAt
) {
}