package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.UserRole;
import com.school.dolphin.identity.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository
        extends JpaRepository<UserRole, UserRoleId> {

    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);

    @Query("""
        SELECT ur
        FROM UserRole ur
        JOIN FETCH ur.role r
        WHERE ur.user.id = :userId
          AND r.active = true
    """)
    List<UserRole> findActiveRolesByUserId(
            @Param("userId") UUID userId
    );
}