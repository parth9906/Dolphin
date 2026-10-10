package com.school.dolphin.academic.dto;


import java.util.UUID;

public record SchoolClassResponse(
        UUID id,
        UUID academicYearId,
        String name,
        String code,
        int sortOrder,
        boolean active
) {}
