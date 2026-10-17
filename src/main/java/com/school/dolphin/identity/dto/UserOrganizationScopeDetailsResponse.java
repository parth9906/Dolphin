
package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.entity.OrganizationScopeType;

import java.util.UUID;

public record UserOrganizationScopeDetailsResponse(
        UUID id,
        UUID userId,
        OrganizationScopeType scopeType,
        UUID scopeId,
        String scopeName
) {
}
