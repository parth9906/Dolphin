package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.organization.dto.CampusResponse;
import com.school.dolphin.organization.dto.CreateCampusRequest;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampusService {

    private final CampusRepository campusRepository;
    private final InstitutionRepository institutionRepository;

    @Transactional
    public CampusResponse create(CreateCampusRequest request) {

        Institution institution = institutionRepository.findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found: " + request.institutionId()
                        )
                );

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
    public CampusResponse getById(UUID id) {

        Campus campus = campusRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Campus not found: " + id
                        )
                );

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
}