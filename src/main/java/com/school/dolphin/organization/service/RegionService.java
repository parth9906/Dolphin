package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.organization.dto.CreateRegionRequest;
import com.school.dolphin.organization.dto.RegionResponse;
import com.school.dolphin.organization.entity.Enterprise;
import com.school.dolphin.organization.entity.Region;
import com.school.dolphin.organization.repository.EnterpriseRepository;
import com.school.dolphin.organization.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;
    private final EnterpriseRepository enterpriseRepository;

    @Transactional
    public RegionResponse create(CreateRegionRequest request) {

        Enterprise enterprise = enterpriseRepository.findById(
                request.enterpriseId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Enterprise not found: " + request.enterpriseId()
                )
        );

        if (!enterprise.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create region under inactive enterprise"
            );
        }

        if (regionRepository.existsByEnterpriseIdAndCode(
                request.enterpriseId(),
                request.code()
        )) {
            throw new DuplicateResourceException(
                    "Region code already exists within enterprise: "
                            + request.code()
            );
        }

        Region region = Region.builder()
                .enterprise(enterprise)
                .code(request.code())
                .name(request.name())
                .active(true)
                .build();

        Region saved = regionRepository.save(region);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RegionResponse getById(UUID id) {

        Region region = regionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Region not found: " + id
                        )
                );

        return toResponse(region);
    }

    @Transactional(readOnly = true)
    public List<RegionResponse> getByEnterprise(UUID enterpriseId) {

        if (!enterpriseRepository.existsById(enterpriseId)) {
            throw new ResourceNotFoundException(
                    "Enterprise not found: " + enterpriseId
            );
        }

        return regionRepository
                .findAllByEnterpriseId(enterpriseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RegionResponse toResponse(Region region) {

        return new RegionResponse(
                region.getId(),
                region.getEnterprise().getId(),
                region.getCode(),
                region.getName(),
                region.isActive()
        );
    }
}