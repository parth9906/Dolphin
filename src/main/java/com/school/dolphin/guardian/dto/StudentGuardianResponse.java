
package com.school.dolphin.guardian.dto;

import java.util.UUID;

public record StudentGuardianResponse(
        UUID guardianId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String relationshipType,
        boolean primaryContact,
        boolean pickupAuthorized
) {}