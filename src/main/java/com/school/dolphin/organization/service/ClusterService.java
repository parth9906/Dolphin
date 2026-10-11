package com.school.dolphin.organization.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.dto.ClusterResponse;
import com.school.dolphin.organization.dto.CreateClusterRequest;
import com.school.dolphin.organization.entity.Cluster;
import com.school.dolphin.organization.entity.Region;
import com.school.dolphin.organization.repository.ClusterRepository;
import com.school.dolphin.organization.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClusterService {

    private final ClusterRepository clusterRepository;
    private final RegionRepository regionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public ClusterResponse create(
            CreateClusterRequest request,
            Authentication authentication
    ) {

        Region region = regionRepository.findById(request.regionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Region not found: " + request.regionId()
                        )
                );

        if (!scopeAuthorization.canAccessRegion(
                authentication, region.getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this region"
            );
        }

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
    public ClusterResponse getById(
            UUID id,
            Authentication authentication
    ) {

        Cluster cluster = clusterRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cluster not found: " + id
                        )
                );

        if (!scopeAuthorization.canAccessCluster(authentication, id)) {
            throw new AccessDeniedException(
                    "You do not have access to this cluster"
            );
        }

        return toResponse(cluster);
    }

    @Transactional(readOnly = true)
    public List<ClusterResponse> getByRegion(
            UUID regionId,
            Authentication authentication
    ) {

        if (!regionRepository.existsById(regionId)) {
            throw new ResourceNotFoundException(
                    "Region not found: " + regionId
            );
        }

        if (!scopeAuthorization.canAccessRegion(authentication, regionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this region"
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
