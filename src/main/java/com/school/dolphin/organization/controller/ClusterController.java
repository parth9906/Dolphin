package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.ClusterResponse;
import com.school.dolphin.organization.dto.CreateClusterRequest;
import com.school.dolphin.organization.service.ClusterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clusters")
@RequiredArgsConstructor
public class ClusterController {

    private final ClusterService clusterService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CLUSTER_CREATE')")
    public ClusterResponse create(
            @Valid @RequestBody CreateClusterRequest request,
            Authentication authentication
    ) {
        return clusterService.create(request, authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CLUSTER_READ')")
    public ClusterResponse getById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return clusterService.getById(id, authentication);
    }

    @GetMapping("/by-region/{regionId}")
    @PreAuthorize("hasAuthority('CLUSTER_READ')")
    public List<ClusterResponse> getByRegion(
            @PathVariable UUID regionId,
            Authentication authentication
    ) {
        return clusterService.getByRegion(regionId, authentication);
    }
}
