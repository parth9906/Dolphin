
package com.school.dolphin.guardian.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LinkGuardianRequest(
        @NotBlank
        @Size(max = 30)
        String relationshipType,

        boolean primaryContact,

        boolean pickupAuthorized
) {}