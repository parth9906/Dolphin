package com.school.dolphin.organization.dto;

import java.util.UUID;

public record EnterpriseResponse(
        UUID id,
        String code,
        String name,
        boolean active
) {
}