package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.dto.CampusResponse;
import com.school.dolphin.organization.dto.CreateCampusRequest;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampusService {

    private final CampusRepository campusRepository;
    private final InstitutionRepository institutionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public CampusResponse create(
            CreateCampusRequest request,
            Authentication authentication
    ) {

        Institution institution = institutionRepository.findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found: " + request.institutionId()
                        )
                );

        if (!SecurityUtils.isPlatformAdmin(authentication) && !scopeAuthorization.canAccessInstitution(
                authentication, institution.getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create campus under inactive institution"
            );
        }

        if (campusRepository.existsByInstitutionIdAndCode(
                request.institutionId(),
                request.code()
        )) {
            throw new DuplicateResourceException(
                    "Campus code already exists in this institution: "
                            + request.code()
            );
        }

        Campus campus = Campus.builder()
                .institution(institution)
                .code(request.code())
                .name(request.name())
                .address(request.address())
                .active(true)
                .build();

        Campus savedCampus = campusRepository.save(campus);

        return toResponse(savedCampus);
    }

    @Transactional(readOnly = true)
    public CampusResponse getById(
            UUID id,
            Authentication authentication
    ) {

        Campus campus = campusRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Campus not found: " + id
                        )
                );

        if (!scopeAuthorization.canAccessCampus(authentication, id)) {
            throw new AccessDeniedException(
                    "You do not have access to this campus"
            );
        }

        return toResponse(campus);
    }

    private CampusResponse toResponse(Campus campus) {

        return new CampusResponse(
                campus.getId(),
                campus.getInstitution().getId(),
                campus.getCode(),
                campus.getName(),
                campus.getAddress(),
                campus.isActive()
        );
    }

    @Transactional(readOnly = true)
    public List<CampusResponse> getByInstitution(
            UUID institutionId,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(institutionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found: " + institutionId
                        )
                );

        if (!SecurityUtils.isPlatformAdmin(authentication)
                && !scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        return campusRepository
                .findAllByInstitution_IdAndActiveTrue(institutionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}
