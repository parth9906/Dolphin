
package com.school.dolphin.identity.security;

import com.school.dolphin.identity.entity.UserOrganizationScope;
import com.school.dolphin.identity.entity.OrganizationScopeType;
import com.school.dolphin.identity.repository.UserOrganizationScopeRepository;
import com.school.dolphin.organization.entity.Cluster;
import com.school.dolphin.organization.entity.Enterprise;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.entity.Region;
import com.school.dolphin.organization.repository.ClusterRepository;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.EnterpriseRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.organization.repository.RegionRepository;
import com.school.dolphin.security.SecurityUtils;
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
    private final EnterpriseRepository enterpriseRepository;
    private final RegionRepository regionRepository;
    private final ClusterRepository clusterRepository;

    public OrganizationScopeAuthorization(
            UserOrganizationScopeRepository scopeRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository,
            EnterpriseRepository enterpriseRepository,
            RegionRepository regionRepository,
            ClusterRepository clusterRepository
    ) {
        this.scopeRepository = scopeRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
        this.enterpriseRepository = enterpriseRepository;
        this.regionRepository = regionRepository;
        this.clusterRepository = clusterRepository;
    }

    @Transactional(readOnly = true)
    public boolean canAccessEnterprise(
            Authentication authentication,
            UUID enterpriseId
    ) {
        if (SecurityUtils.isPlatformAdmin(authentication)) {
            return true;
        }
        UUID userId = getAuthenticatedUserId(authentication);

        if (userId == null || enterpriseId == null) {
            return false;
        }

        Enterprise enterprise = enterpriseRepository
                .findById(enterpriseId)
                .orElse(null);

        if (enterprise == null || !enterprise.isActive()) {
            return false;
        }

        List<UserOrganizationScope> scopes =
                scopeRepository.findByUser_Id(userId);

        for (UserOrganizationScope scope : scopes) {
            UUID scopeId = scope.getScopeId();

            switch (scope.getScopeType()) {
                case ENTERPRISE -> {
                    if (enterprise.getId().equals(scopeId)) {
                        return true;
                    }
                }
                case REGION -> {
                    Region region = regionRepository.findById(scopeId)
                            .orElse(null);

                    if (region != null
                            && region.getEnterprise() != null
                            && region.getEnterprise().getId().equals(enterpriseId)) {
                        return true;
                    }
                }
                case CLUSTER -> {
                    Cluster cluster = clusterRepository.findById(scopeId)
                            .orElse(null);

                    if (cluster != null
                            && cluster.getRegion() != null
                            && cluster.getRegion().getEnterprise() != null
                            && cluster.getRegion().getEnterprise()
                            .getId().equals(enterpriseId)) {
                        return true;
                    }
                }
                case INSTITUTION -> {
                    Institution institution = institutionRepository
                            .findById(scopeId).orElse(null);

                    if (institution != null
                            && institution.getCluster() != null
                            && institution.getCluster().getRegion() != null
                            && institution.getCluster().getRegion().getEnterprise()
                            .getId().equals(enterpriseId)) {
                        return true;
                    }
                }
                case CAMPUS -> {
                    Campus campus = campusRepository.findById(scopeId)
                            .orElse(null);

                    if (campus != null
                            && campus.getInstitution() != null
                            && campus.getInstitution().getCluster() != null
                            && campus.getInstitution().getCluster().getRegion()
                            .getEnterprise().getId().equals(enterpriseId)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public boolean canAccessRegion(
            Authentication authentication,
            UUID regionId
    ) {
        if (SecurityUtils.isPlatformAdmin(authentication)) {
            return true;
        }
        UUID userId = getAuthenticatedUserId(authentication);

        if (userId == null || regionId == null) {
            return false;
        }

        Region region = regionRepository.findById(regionId).orElse(null);

        if (region == null || !region.isActive()) {
            return false;
        }

        Enterprise enterprise = region.getEnterprise();

        if (enterprise == null || !enterprise.isActive()) {
            return false;
        }

        List<UserOrganizationScope> scopes =
                scopeRepository.findByUser_Id(userId);

        for (UserOrganizationScope scope : scopes) {
            switch (scope.getScopeType()) {
                case ENTERPRISE -> {
                    if (enterprise.getId().equals(scope.getScopeId())) {
                        return true;
                    }
                }
                case REGION -> {
                    if (region.getId().equals(scope.getScopeId())) {
                        return true;
                    }
                }
                default -> {
                    // Lower-level scopes do not grant access to this region.
                }
            }
        }

        return false;
    }

    @Transactional(readOnly = true)
    public boolean canAccessCluster(
            Authentication authentication,
            UUID clusterId
    ) {
        if (SecurityUtils.isPlatformAdmin(authentication)) {
            return true;
        }

        UUID userId = getAuthenticatedUserId(authentication);

        if (userId == null || clusterId == null) {
            return false;
        }

        Cluster cluster = clusterRepository.findById(clusterId).orElse(null);

        if (cluster == null || !cluster.isActive()) {
            return false;
        }

        Region region = cluster.getRegion();

        if (region == null || !region.isActive()) {
            return false;
        }

        Enterprise enterprise = region.getEnterprise();

        if (enterprise == null || !enterprise.isActive()) {
            return false;
        }

        List<UserOrganizationScope> scopes =
                scopeRepository.findByUser_Id(userId);

        for (UserOrganizationScope scope : scopes) {
            switch (scope.getScopeType()) {
                case ENTERPRISE -> {
                    if (enterprise.getId().equals(scope.getScopeId())) {
                        return true;
                    }
                }
                case REGION -> {
                    if (region.getId().equals(scope.getScopeId())) {
                        return true;
                    }
                }
                case CLUSTER -> {
                    if (cluster.getId().equals(scope.getScopeId())) {
                        return true;
                    }
                }
                default -> {
                    // Lower-level scopes do not grant access to this cluster.
                }
            }
        }

        return false;
    }

    @Transactional(readOnly = true)
    public boolean canAccessInstitution(
            Authentication authentication,
            UUID institutionId
    ) {
        if (SecurityUtils.isPlatformAdmin(authentication)) {
            return true;
        }

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
        if (SecurityUtils.isPlatformAdmin(authentication)) {
            return true;
        }

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
