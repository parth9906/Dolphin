package com.school.dolphin.homework.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record SubmitAssignmentRequest(
        @NotBlank
        @Size(max = 50000)
        String submissionText,

        @PositiveOrZero
        Long version
) {}
