package com.school.dolphin.academic.dto;


import com.school.dolphin.academic.entity.AcademicYearStatus;

import java.time.LocalDate;
import java.util.UUID;

public record AcademicYearResponse(
        UUID id,
        UUID institutionId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        AcademicYearStatus status
) {}
