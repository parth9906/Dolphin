
package com.school.dolphin.guardian.dto;

import java.util.UUID;

public record GuardianResponse(
        UUID id,
        UUID institutionId,
        String firstName,
        String lastName,
        String email,
        String phone,
        boolean active
) {}