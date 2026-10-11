package com.school.dolphin.homework.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record GradeAssignmentSubmissionRequest(
        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 6, fraction = 2)
        BigDecimal marksObtained,

        @Size(max = 2000)
        String feedback,

        @NotNull
        Long version
) {}
