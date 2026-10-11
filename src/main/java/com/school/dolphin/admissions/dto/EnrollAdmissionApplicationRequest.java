package com.school.dolphin.admissions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record EnrollAdmissionApplicationRequest(
        @NotNull UUID sectionId,
        @NotBlank @Size(max = 50) String admissionNumber,
        @NotNull LocalDate startDate
) {}
