package com.school.dolphin.academic.dto;


import java.util.UUID;

public record ClassSectionResponse(
        UUID id,
        UUID schoolClassId,
        UUID campusId,
        String name,
        Integer capacity,
        long activeEnrollmentCount,
        boolean active
) {}
