package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.dto.CreateEnterpriseRequest;
import com.school.dolphin.organization.dto.EnterpriseResponse;
import com.school.dolphin.organization.entity.Enterprise;
import com.school.dolphin.organization.repository.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository enterpriseRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public EnterpriseResponse create(CreateEnterpriseRequest request) {

        if (enterpriseRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException(
                    "Enterprise code already exists: " + request.code()
            );
        }

        Enterprise enterprise = Enterprise.builder()
                .code(request.code())
                .name(request.name())
                .active(true)
                .build();

        Enterprise saved = enterpriseRepository.save(enterprise);

        return new EnterpriseResponse(
                saved.getId(),
                saved.getCode(),
                saved.getName(),
                saved.isActive()
        );
    }

    @Transactional(readOnly = true)
    public EnterpriseResponse getById(
            UUID id,
            Authentication authentication
    ) {

        Enterprise enterprise = enterpriseRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Enterprise not found: " + id
                        )
                );

        if (!scopeAuthorization.canAccessEnterprise(authentication, id)) {
            throw new AccessDeniedException(
                    "You do not have access to this enterprise"
            );
        }

        return new EnterpriseResponse(
                enterprise.getId(),
                enterprise.getCode(),
                enterprise.getName(),
                enterprise.isActive()
        );
    }

    @Transactional(readOnly = true)
    public List<EnterpriseResponse> getAllActive(
            Authentication authentication
    ) {
        return enterpriseRepository.findAllByActiveTrue()
                .stream()
                .filter(enterprise ->
                        scopeAuthorization.canAccessEnterprise(
                                authentication,
                                enterprise.getId()
                        )
                )
                .map(enterprise -> new EnterpriseResponse(
                        enterprise.getId(),
                        enterprise.getCode(),
                        enterprise.getName(),
                        enterprise.isActive()
                ))
                .toList();
    }
}
