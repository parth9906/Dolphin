package com.school.dolphin.homework.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record UpdateAssignmentRequest(
        @Size(min = 1, max = 200)
        String title,

        @Size(min = 1, max = 10000)
        String instructions,

        OffsetDateTime dueAt,

        @DecimalMin(value = "0.01")
        BigDecimal maxMarks
) {}