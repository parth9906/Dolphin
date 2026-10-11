package com.school.dolphin.hostel.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.hostel.dto.CreateHostelRequest;
import com.school.dolphin.hostel.dto.HostelResponse;
import com.school.dolphin.hostel.dto.UpdateHostelRequest;
import com.school.dolphin.hostel.entity.Hostel;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import com.school.dolphin.hostel.repository.HostelAllocationRepository;
import com.school.dolphin.hostel.repository.HostelRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HostelService {

    private static final int MAX_PAGE_SIZE = 100;

    private final HostelRepository hostelRepository;
    private final HostelAllocationRepository hostelAllocationRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public HostelResponse create(
            CreateHostelRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create a hostel for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId());

        String code = request.code().trim();

        if (hostelRepository.existsByInstitution_IdAndCodeIgnoreCase(
                institution.getId(), code)) {
            throw new DuplicateResourceException(
                    "A hostel with this code already exists");
        }

        UserAccount creator =
                authenticatedUserResolver.requireUserAccount(authentication);

        Hostel hostel = Hostel.builder()
                .institution(institution)
                .campus(campus)
                .code(code)
                .name(request.name().trim())
                .hostelType(request.hostelType())
                .wardenName(normalize(request.wardenName()))
                .address(normalize(request.address()))
                .active(true)
                .createdBy(creator)
                .build();

        return HostelResponse.from(hostelRepository.save(hostel));
    }

    @Transactional
    public HostelResponse update(
            UUID hostelId,
            UpdateHostelRequest request,
            Authentication authentication
    ) {
        Hostel hostel = requireHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        if (!hostel.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot update an inactive hostel");
        }

        ensureVersion(hostel, request.version());

        hostel.setName(request.name().trim());
        hostel.setHostelType(request.hostelType());
        hostel.setWardenName(normalize(request.wardenName()));
        hostel.setAddress(normalize(request.address()));

        return HostelResponse.from(hostelRepository.save(hostel));
    }

    @Transactional
    public HostelResponse deactivate(
            UUID hostelId,
            Authentication authentication
    ) {
        Hostel hostel = requireHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        if (!hostel.isActive()) {
            throw new BusinessRuleViolationException(
                    "Hostel is already inactive");
        }

        long activeAllocations = hostelAllocationRepository
                .countByRoom_Hostel_IdAndStatus(
                        hostelId, HostelAllocationStatus.ACTIVE);

        if (activeAllocations > 0) {
            throw new BusinessRuleViolationException(
                    "Cannot deactivate a hostel with active allocations");
        }

        hostel.setActive(false);

        return HostelResponse.from(hostelRepository.save(hostel));
    }

    @Transactional(readOnly = true)
    public HostelResponse getById(
            UUID hostelId,
            Authentication authentication
    ) {
        Hostel hostel = requireHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        return HostelResponse.from(hostel);
    }

    @Transactional(readOnly = true)
    public Page<HostelResponse> search(
            UUID institutionId,
            UUID campusId,
            Boolean active,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        requireInstitutionAccess(authentication, institutionId);

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return hostelRepository
                .search(institutionId, campusId, active, pageable)
                .map(HostelResponse::from);
    }

    private Hostel requireHostel(UUID hostelId) {
        return hostelRepository.findById(hostelId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hostel not found"));
    }

    private Campus resolveCampus(
            UUID campusId,
            UUID institutionId
    ) {
        if (campusId == null) {
            return null;
        }

        Campus campus = requireCampusInInstitution(campusId, institutionId);

        if (!campus.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create a hostel for an inactive campus");
        }

        return campus;
    }

    private Campus requireCampusInInstitution(
            UUID campusId,
            UUID institutionId
    ) {
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Campus not found"));

        if (!campus.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Campus does not belong to the requested institution");
        }

        return campus;
    }

    private void ensureVersion(Hostel hostel, Long version) {
        if (version == null || !version.equals(hostel.getVersion())) {
            throw new StaleResourceVersionException(
                    "The hostel was modified by another request. "
                            + "Reload it and try again.");
        }
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
