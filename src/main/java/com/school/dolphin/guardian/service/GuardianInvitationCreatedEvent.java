
package com.school.dolphin.guardian.service;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GuardianInvitationCreatedEvent(
        UUID invitationId,
        String email,
        String rawToken,
        OffsetDateTime expiresAt
) {}