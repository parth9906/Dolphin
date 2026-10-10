package com.school.dolphin.identity.dto;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UUID userId,
        String username
) {
}