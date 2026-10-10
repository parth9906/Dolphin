
package com.school.dolphin.guardian.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GuardianInvitationResponse(
        UUID invitationId,
        String email,
        OffsetDateTime expiresAt
) {}