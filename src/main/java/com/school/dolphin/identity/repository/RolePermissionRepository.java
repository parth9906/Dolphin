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

    @Query("""
        SELECT rp
        FROM RolePermission rp
        JOIN FETCH rp.permission p
        WHERE rp.role.id = :roleId
          AND p.active = true
    """)
    List<RolePermission> findActivePermissionsByRoleId(
            @Param("roleId") UUID roleId
    );
}