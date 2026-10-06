package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.organization.dto.CreateEnterpriseRequest;
import com.school.dolphin.organization.dto.EnterpriseResponse;
import com.school.dolphin.organization.entity.Enterprise;
import com.school.dolphin.organization.repository.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository enterpriseRepository;

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
    public EnterpriseResponse getById(UUID id) {

        Enterprise enterprise = enterpriseRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Enterprise not found: " + id
                        )
                );

        return new EnterpriseResponse(
                enterprise.getId(),
                enterprise.getCode(),
                enterprise.getName(),
                enterprise.isActive()
        );
    }
}