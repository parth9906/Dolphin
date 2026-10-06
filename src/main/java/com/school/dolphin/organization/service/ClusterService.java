package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.organization.dto.ClusterResponse;
import com.school.dolphin.organization.dto.CreateClusterRequest;
import com.school.dolphin.organization.entity.Cluster;
import com.school.dolphin.organization.entity.Region;
import com.school.dolphin.organization.repository.ClusterRepository;
import com.school.dolphin.organization.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClusterService {

    private final ClusterRepository clusterRepository;
    private final RegionRepository regionRepository;

    @Transactional
    public ClusterResponse create(CreateClusterRequest request) {

        Region region = regionRepository.findById(request.regionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Region not found: " + request.regionId()
                        )
                );

        if (!region.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create cluster under inactive region"
            );
        }

        if (clusterRepository.existsByRegionIdAndCode(
                request.regionId(),
                request.code()
        )) {
            throw new DuplicateResourceException(
                    "Cluster code already exists within region: "
                            + request.code()
            );
        }

        Cluster cluster = Cluster.builder()
                .region(region)
                .code(request.code())
                .name(request.name())
                .active(true)
                .build();

        Cluster saved = clusterRepository.save(cluster);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClusterResponse getById(UUID id) {

        Cluster cluster = clusterRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cluster not found: " + id
                        )
                );

        return toResponse(cluster);
    }

    @Transactional(readOnly = true)
    public List<ClusterResponse> getByRegion(UUID regionId) {

        if (!regionRepository.existsById(regionId)) {
            throw new ResourceNotFoundException(
                    "Region not found: " + regionId
            );
        }

        return clusterRepository
                .findAllByRegionId(regionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ClusterResponse toResponse(Cluster cluster) {

        return new ClusterResponse(
                cluster.getId(),
                cluster.getRegion().getId(),
                cluster.getCode(),
                cluster.getName(),
                cluster.isActive()
        );
    }
}