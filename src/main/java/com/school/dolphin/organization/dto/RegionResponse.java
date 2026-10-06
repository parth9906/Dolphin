package com.school.dolphin.organization.dto;

import java.util.UUID;

public record RegionResponse(
        UUID id,
        UUID enterpriseId,
        String code,
        String name,
        boolean active
) {
}