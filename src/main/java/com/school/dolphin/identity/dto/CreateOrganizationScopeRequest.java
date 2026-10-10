package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.entity.OrganizationScopeType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateOrganizationScopeRequest(

        @NotNull(message = "Scope type is required")
        OrganizationScopeType scopeType,

        @NotNull(message = "Scope ID is required")
        UUID scopeId
) {}