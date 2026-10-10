
package com.school.dolphin.identity.security;

import com.school.dolphin.identity.entity.UserOrganizationScope;
import com.school.dolphin.identity.repository.UserOrganizationScopeRepository;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component("organizationScopeAuthorization")
public class OrganizationScopeAuthorization {

    private final UserOrganizationScopeRepository scopeRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;

    public OrganizationScopeAuthorization(
            UserOrganizationScopeRepository scopeRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository
    ) {
        this.scopeRepository = scopeRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
    }

    @Transactional(readOnly = true)
    public boolean canAccessInstitution(
            Authentication authentication,
            UUID institutionId
    ) {
        UUID userId = getAuthenticatedUserId(authentication);

        if (userId == null || institutionId == null) {
            return false;
        }

        Institution institution = institutionRepository
                .findById(institutionId)
                .orElse(null);

        if (institution == null || !isInstitutionHierarchyActive(institution)) {
            return false;
        }

        List<UserOrganizationScope> scopes =
                scopeRepository.findByUser_Id(userId);

        for (UserOrganizationScope scope : scopes) {
            UUID scopeId = scope.getScopeId();

            switch (scope.getScopeType()) {
                case ENTERPRISE -> {
                    if (institution.getCluster().getRegion()
                            .getEnterprise().getId().equals(scopeId)) {
                        return true;
                    }
                }
                case REGION -> {
                    if (institution.getCluster().getRegion()
                            .getId().equals(scopeId)) {
                        return true;
                    }
                }
                case CLUSTER -> {
                    if (institution.getCluster().getId().equals(scopeId)) {
                        return true;
                    }
                }
                case INSTITUTION -> {
                    if (institution.getId().equals(scopeId)) {
                        return true;
                    }
                }
                case CAMPUS -> {
                    // A campus assignment does not grant institution-wide access.
                }
            }
        }

        return false;
    }

    @Transactional(readOnly = true)
    public boolean canAccessCampus(
            Authentication authentication,
            UUID campusId
    ) {
        UUID userId = getAuthenticatedUserId(authentication);

        if (userId == null || campusId == null) {
            return false;
        }

        Campus campus = campusRepository.findById(campusId).orElse(null);

        if (campus == null || !campus.isActive()) {
            return false;
        }

        Institution institution = campus.getInstitution();

        if (!isInstitutionHierarchyActive(institution)) {
            return false;
        }

        List<UserOrganizationScope> scopes =
                scopeRepository.findByUser_Id(userId);

        for (UserOrganizationScope scope : scopes) {
            UUID scopeId = scope.getScopeId();

            switch (scope.getScopeType()) {
                case ENTERPRISE -> {
                    if (institution.getCluster().getRegion()
                            .getEnterprise().getId().equals(scopeId)) {
                        return true;
                    }
                }
                case REGION -> {
                    if (institution.getCluster().getRegion()
                            .getId().equals(scopeId)) {
                        return true;
                    }
                }
                case CLUSTER -> {
                    if (institution.getCluster().getId().equals(scopeId)) {
                        return true;
                    }
                }
                case INSTITUTION -> {
                    if (institution.getId().equals(scopeId)) {
                        return true;
                    }
                }
                case CAMPUS -> {
                    if (campus.getId().equals(scopeId)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private UUID getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        if (authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.userId();
        }

        return null;
    }

    private boolean isInstitutionHierarchyActive(Institution institution) {
        return institution != null
                && institution.isActive()
                && institution.getCluster() != null
                && institution.getCluster().isActive()
                && institution.getCluster().getRegion() != null
                && institution.getCluster().getRegion().isActive()
                && institution.getCluster().getRegion().getEnterprise() != null
                && institution.getCluster().getRegion()
                .getEnterprise().isActive();
    }
}