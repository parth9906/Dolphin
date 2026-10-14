package com.school.dolphin.identity.dto;

import java.util.List;
import java.util.UUID;

public record AccessContextResponse(
        UUID userId,
        String username,
        List<String> roles,
        List<String> permissions,
        List<AccessScopeResponse> scopes
) {
    public record AccessScopeResponse(
            String scopeType,
            UUID scopeId
    ) {
    }
}