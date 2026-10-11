package com.school.dolphin.admissions.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateAdmissionApplicationRequest(
        UUID campusId,
        @NotNull UUID applyingClassId,
        @Size(max = 200) String parentName,
        @Size(max = 30) String parentPhone,
        @Email @Size(max = 200) String parentEmail,
        @Size(max = 2000) String notes
) {}
