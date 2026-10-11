package com.school.dolphin.homework.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PublishAssignmentRequest(
        @NotNull
        @PositiveOrZero
        Long version
) {
}
