
package com.school.dolphin.guardian.dto;

import java.util.UUID;

public record GuardianAccountAcceptedResponse(
        UUID userId,
        String username,
        String message
) {}