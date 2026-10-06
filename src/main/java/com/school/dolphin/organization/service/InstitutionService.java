package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.organization.dto.CreateInstitutionRequest;
import com.school.dolphin.organization.dto.InstitutionResponse;
import com.school.dolphin.organization.entity.Cluster;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.ClusterRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final ClusterRepository clusterRepository;

    @Transactional
    public InstitutionResponse create(CreateInstitutionRequest request) {

        Cluster cluster = clusterRepository.findById(request.clusterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cluster not found: " + request.clusterId()
                        )
                );

        if (!cluster.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create institution under inactive cluster"
            );
        }

        if (institutionRepository.existsByClusterIdAndCode(
                request.clusterId(),
                request.code()
        )) {
            throw new DuplicateResourceException(
                    "Institution code already exists in this cluster: "
                            + request.code()
            );
        }

        Institution institution = Institution.builder()
                .cluster(cluster)
                .code(request.code())
                .name(request.name())
                .institutionType(request.institutionType())
                .active(true)
                .build();

        Institution savedInstitution = institutionRepository.save(institution);

        return toResponse(savedInstitution);
    }

    @Transactional(readOnly = true)
    public InstitutionResponse getById(UUID id) {

        Institution institution = institutionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found: " + id
                        )
                );

        return toResponse(institution);
    }

    private InstitutionResponse toResponse(Institution institution) {

        return new InstitutionResponse(
                institution.getId(),
                institution.getCluster().getId(),
                institution.getCode(),
                institution.getName(),
                institution.getInstitutionType(),
                institution.isActive()
        );
    }
}