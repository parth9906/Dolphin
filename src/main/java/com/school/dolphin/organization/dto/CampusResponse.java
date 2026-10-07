package com.school.dolphin.organization.dto;

import java.util.UUID;

public record CampusResponse(
        UUID id,
        UUID institutionId,
        String code,
        String name,
        String address,
        boolean active
) {
}