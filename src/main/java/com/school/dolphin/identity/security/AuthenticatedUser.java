package com.school.dolphin.identity.security;

import java.util.UUID;

public record AuthenticatedUser(
        UUID userId,
        String username
) {
}