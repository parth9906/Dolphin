package com.school.dolphin.timetable.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssignSubstituteRequest(
        @NotNull UUID substituteStaffAssignmentId,
        @Size(max = 1000) String comment) {
}