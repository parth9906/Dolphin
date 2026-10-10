package com.school.dolphin.identity.dto;

import java.util.UUID;

public record RoleResponse(
        UUID id,
        String code,
        String name,
        String description,
        boolean active
) {
}