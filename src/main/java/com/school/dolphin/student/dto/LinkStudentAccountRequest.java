package com.school.dolphin.student.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LinkStudentAccountRequest(
        @NotNull UUID userAccountId
) {
}
