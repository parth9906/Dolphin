package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateClassSectionRequest(
        @NotNull UUID schoolClassId,
        UUID campusId,
        @NotBlank @Size(max = 50) String name,
        @Positive Integer capacity
) {}
