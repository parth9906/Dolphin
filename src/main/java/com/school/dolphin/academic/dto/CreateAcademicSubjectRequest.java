package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAcademicSubjectRequest(
        @NotNull UUID institutionId,

        @NotBlank @Size(max = 30)
        String code,

        @NotBlank @Size(max = 120)
        String name,

        @Size(max = 500)
        String description
) {}