package com.school.dolphin.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePermissionRequest(

        @NotBlank(message = "Permission code is required")
        @Size(max = 150, message = "Permission code must not exceed 150 characters")
        String code,

        @NotBlank(message = "Permission name is required")
        @Size(max = 200, message = "Permission name must not exceed 200 characters")
        String name,

        String description
) {
}