package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateStudentPromotionBatchRequest(

        @NotNull
        UUID sourceAcademicYearId,

        @NotNull
        UUID targetAcademicYearId

) {
}