package com.school.dolphin.academic.dto;

import com.school.dolphin.academic.entity.StudentPromotionDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateStudentPromotionDecisionRequest(

        @NotNull
        StudentPromotionDecision decision,

        UUID targetSectionId,

        @Size(max = 500)
        String reason

) {
}