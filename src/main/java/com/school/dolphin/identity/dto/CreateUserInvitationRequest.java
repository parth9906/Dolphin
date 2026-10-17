
package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.entity.OrganizationScopeType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateUserInvitationRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 255, message = "Email cannot exceed 255 characters")
        String email,

        @NotBlank(message = "Username is required")
        @Size(max = 100, message = "Username cannot exceed 100 characters")
        String username,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name cannot exceed 100 characters")
        String firstName,

        @Size(max = 100, message = "Last name cannot exceed 100 characters")
        String lastName,

        @NotNull(message = "Role ID is required")
        UUID roleId,

        @NotNull(message = "Scope type is required")
        OrganizationScopeType scopeType,

        @NotNull(message = "Scope ID is required")
        UUID scopeId
) {
}
