package com.school.dolphin.identity.service;

import com.school.dolphin.identity.repository.RolePermissionRepository;
import com.school.dolphin.identity.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Loads a caller's current effective authorization data. This is the only
 * place request authentication reads roles and permissions from PostgreSQL; it
 * is invoked when issuing or refreshing a token, never per normal request.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationSnapshotService {

    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Transactional(readOnly = true)
    public Snapshot load(UUID userId) {

        List<String> roleCodes =
                userRoleRepository.findActiveRoleCodesByUserId(userId);

        List<String> permissionCodes =
                rolePermissionRepository
                        .findEffectivePermissionCodesByUserId(userId);

        return new Snapshot(roleCodes, permissionCodes);
    }

    public record Snapshot(
            List<String> roleCodes,
            List<String> permissionCodes
    ) {
    }
}
