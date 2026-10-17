
package com.school.dolphin.identity.dto;

import java.util.UUID;

public record AcceptUserInvitationResponse(
        UUID userId,
        String username,
        String message
) {
}
