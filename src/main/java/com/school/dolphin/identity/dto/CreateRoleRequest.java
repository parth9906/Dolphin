package com.school.dolphin.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest(

        @NotBlank(message = "Role code is required")
        @Size(max = 100, message = "Role code must not exceed 100 characters")
        String code,

        @NotBlank(message = "Role name is required")
        @Size(max = 150, message = "Role name must not exceed 150 characters")
        String name,

        String description
) {
}