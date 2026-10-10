package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AssignTeacherSubjectRequest(
        @NotNull UUID staffAssignmentId,
        @NotNull UUID subjectId,
        @NotNull LocalDate startDate,
        LocalDate endDate
) {}