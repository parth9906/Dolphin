
package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.validation.BcryptPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptUserInvitationRequest(

        @NotBlank(message = "Invitation token is required")
        String token,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must contain between 8 and 72 characters")
        @BcryptPassword
        String password
) {
}
