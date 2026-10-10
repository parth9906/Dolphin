package com.school.dolphin.assessment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateStudentMarkRequest(
        @NotNull
        Long version,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal marksObtained,

        @Size(max = 500)
        String remarks
) {}