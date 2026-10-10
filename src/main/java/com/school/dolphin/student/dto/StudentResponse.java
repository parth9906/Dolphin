package com.school.dolphin.student.dto;

import java.time.LocalDate;
import java.util.UUID;

public record StudentResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String admissionNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        boolean active
) {}