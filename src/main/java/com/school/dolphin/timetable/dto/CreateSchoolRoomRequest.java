package com.school.dolphin.timetable.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSchoolRoomRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotBlank @Size(max = 30) String code,
        @NotBlank @Size(max = 100) String name,
        @Positive Integer capacity
) {}
