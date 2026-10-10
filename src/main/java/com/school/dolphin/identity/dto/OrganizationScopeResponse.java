package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.entity.OrganizationScopeType;

import java.util.UUID;

public record OrganizationScopeResponse(
        UUID id,
        UUID userId,
        OrganizationScopeType scopeType,
        UUID scopeId
) {}