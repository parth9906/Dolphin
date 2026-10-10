package com.school.dolphin.identity.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean active
) {
}