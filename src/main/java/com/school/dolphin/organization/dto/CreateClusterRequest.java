package com.school.dolphin.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateClusterRequest(

        @NotNull(message = "Region ID is required")
        UUID regionId,

        @NotBlank(message = "Code is required")
        @Size(max = 50, message = "Code must not exceed 50 characters")
        String code,

        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name
) {
}