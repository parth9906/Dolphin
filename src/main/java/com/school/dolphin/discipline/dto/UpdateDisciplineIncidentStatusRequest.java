package com.school.dolphin.discipline.dto;

import com.school.dolphin.discipline.entity.DisciplineIncidentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDisciplineIncidentStatusRequest(
        @NotNull DisciplineIncidentStatus status
) {}
