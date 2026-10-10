package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.dto.CreateOrganizationScopeRequest;
import com.school.dolphin.identity.dto.OrganizationScopeResponse;
import com.school.dolphin.identity.entity.*;
import com.school.dolphin.identity.repository.UserOrganizationScopeRepository;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.ClusterRepository;
import com.school.dolphin.organization.repository.EnterpriseRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.organization.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserOrganizationScopeService {

    private final UserAccountRepository userAccountRepository;
    private final UserOrganizationScopeRepository scopeRepository;

    private final EnterpriseRepository enterpriseRepository;
    private final RegionRepository regionRepository;
    private final ClusterRepository clusterRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;

    @Transactional
    public OrganizationScopeResponse assignScope(
            UUID userId,
            CreateOrganizationScopeRequest request
    ) {

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId
                        )
                );

        if (!user.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign scope to inactive user"
            );
        }

        validateScope(request.scopeType(), request.scopeId());

        if (scopeRepository.existsByUserIdAndScopeTypeAndScopeId(
                userId,
                request.scopeType(),
                request.scopeId()
        )) {
            throw new DuplicateResourceException(
                    "Scope is already assigned to this user"
            );
        }

        UserOrganizationScope scope = UserOrganizationScope.builder()
                .user(user)
                .scopeType(request.scopeType())
                .scopeId(request.scopeId())
                .build();

        scopeRepository.save(scope);

        return toResponse(scope);
    }

    private void validateScope(
            OrganizationScopeType scopeType,
            UUID scopeId
    ) {

        switch (scopeType) {

            case ENTERPRISE -> {
                var enterprise = enterpriseRepository.findById(scopeId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Enterprise not found: " + scopeId
                                )
                        );

                if (!enterprise.isActive()) {
                    throw new BusinessRuleViolationException(
                            "Cannot assign inactive enterprise as scope"
                    );
                }
            }

            case REGION -> {
                var region = regionRepository.findById(scopeId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Region not found: " + scopeId
                                )
                        );

                if (!region.isActive()) {
                    throw new BusinessRuleViolationException(
                            "Cannot assign inactive region as scope"
                    );
                }
            }

            case CLUSTER -> {
                var cluster = clusterRepository.findById(scopeId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Cluster not found: " + scopeId
                                )
                        );

                if (!cluster.isActive()) {
                    throw new BusinessRuleViolationException(
                            "Cannot assign inactive cluster as scope"
                    );
                }
            }

            case INSTITUTION -> {
                var institution = institutionRepository.findById(scopeId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Institution not found: " + scopeId
                                )
                        );

                if (!institution.isActive()) {
                    throw new BusinessRuleViolationException(
                            "Cannot assign inactive institution as scope"
                    );
                }
            }

            case CAMPUS -> {
                var campus = campusRepository.findById(scopeId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Campus not found: " + scopeId
                                )
                        );

                if (!campus.isActive()) {
                    throw new BusinessRuleViolationException(
                            "Cannot assign inactive campus as scope"
                    );
                }
            }
        }
    }

    private OrganizationScopeResponse toResponse(
            UserOrganizationScope scope
    ) {
        return new OrganizationScopeResponse(
                scope.getId(),
                scope.getUser().getId(),
                scope.getScopeType(),
                scope.getScopeId()
        );
    }
}