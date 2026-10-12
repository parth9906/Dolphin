package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.RolePermission;
import com.school.dolphin.identity.entity.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository
        extends JpaRepository<RolePermission, RolePermissionId> {

    boolean existsByRoleIdAndPermissionId(
            UUID roleId,
            UUID permissionId
    );

    /**
     * Effective permission codes across every active role held by the user, in
     * a single query (no per-role loop). Inactive roles and inactive
     * permissions are excluded before the codes are placed in a token.
     */
    @Query("""
        SELECT DISTINCT p.code
        FROM RolePermission rp
        JOIN rp.permission p
        WHERE p.active = true
          AND rp.role.id IN (
              SELECT ur.role.id
              FROM UserRole ur
              WHERE ur.user.id = :userId
                AND ur.role.active = true
          )
        ORDER BY p.code
    """)
    List<String> findEffectivePermissionCodesByUserId(
            @Param("userId") UUID userId
    );
}
