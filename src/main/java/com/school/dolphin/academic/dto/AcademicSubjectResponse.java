package com.school.dolphin.academic.dto;

import java.util.UUID;

public record AcademicSubjectResponse(
        UUID id,
        UUID institutionId,
        String code,
        String name,
        String description,
        boolean active
) {}