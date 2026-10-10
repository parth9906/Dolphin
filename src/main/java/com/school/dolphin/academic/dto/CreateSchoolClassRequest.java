package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSchoolClassRequest(
        @NotNull UUID academicYearId,
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 30) String code,
        @Min(0) int sortOrder
) {}
