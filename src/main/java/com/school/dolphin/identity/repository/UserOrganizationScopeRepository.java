package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.OrganizationScopeType;
import com.school.dolphin.identity.entity.UserOrganizationScope;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserOrganizationScopeRepository
        extends JpaRepository<UserOrganizationScope, UUID> {

    boolean existsByUserIdAndScopeTypeAndScopeId(
            UUID userId,
            OrganizationScopeType scopeType,
            UUID scopeId
    );

    List<UserOrganizationScope> findByUser_Id(UUID userId);
}