
package com.school.dolphin.guardian.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateGuardianRequest(
        @NotBlank
        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @Email
        @Size(max = 255)
        String email,

        @Size(max = 30)
        String phone
) {}