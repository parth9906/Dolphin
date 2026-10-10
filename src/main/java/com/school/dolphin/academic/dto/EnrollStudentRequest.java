package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record EnrollStudentRequest(
        @NotNull UUID studentId,
        @NotNull UUID sectionId,
        @NotNull LocalDate startDate
) {}
