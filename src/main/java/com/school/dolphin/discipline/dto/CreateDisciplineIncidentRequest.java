package com.school.dolphin.discipline.dto;

import com.school.dolphin.discipline.entity.DisciplineCategory;
import com.school.dolphin.discipline.entity.DisciplineSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDisciplineIncidentRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotNull UUID studentId,
        @NotNull DisciplineCategory category,
        @NotNull DisciplineSeverity severity,
        @NotBlank @Size(max = 2000) String description,
        @NotNull @PastOrPresent LocalDate incidentDate
) {}
