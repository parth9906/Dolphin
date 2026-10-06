package com.school.dolphin.organization.dto;

import java.util.UUID;

public record ClusterResponse(
        UUID id,
        UUID regionId,
        String code,
        String name,
        boolean active
) {
}