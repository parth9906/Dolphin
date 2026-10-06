package com.school.dolphin.organization.dto;

import java.util.UUID;

public record InstitutionResponse(
        UUID id,
        UUID clusterId,
        String code,
        String name,
        String institutionType,
        boolean active
) {}