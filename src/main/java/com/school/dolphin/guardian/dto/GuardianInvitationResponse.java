
package com.school.dolphin.guardian.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GuardianInvitationResponse(
        UUID invitationId,
        String token,
        String email,
        OffsetDateTime expiresAt
) {}
