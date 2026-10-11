package com.school.dolphin.admissions.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

public record CreateAdmissionApplicationRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotNull UUID applyingClassId,
        @NotBlank @Size(max = 100) String applicantFirstName,
        @NotBlank @Size(max = 100) String applicantLastName,
        @NotNull @Past LocalDate applicantDateOfBirth,
        @Size(max = 200) String parentName,
        @Size(max = 30) String parentPhone,
        @Email @Size(max = 200) String parentEmail,
        @Size(max = 2000) String notes,
        LocalDate applicationDate
) {}
