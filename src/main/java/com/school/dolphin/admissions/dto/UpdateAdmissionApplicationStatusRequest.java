package com.school.dolphin.admissions.dto;

import com.school.dolphin.admissions.entity.AdmissionApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdmissionApplicationStatusRequest(
        @NotNull AdmissionApplicationStatus status
) {}
