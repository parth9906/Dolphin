package com.school.dolphin.homework.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateAssignmentRequest(
        @NotNull UUID institutionId,
        @NotNull UUID sectionId,

        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        @Size(max = 10000)
        String instructions,

        @NotNull
        OffsetDateTime dueAt,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal maxMarks
) {}