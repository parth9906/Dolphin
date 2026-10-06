package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.ClusterResponse;
import com.school.dolphin.organization.dto.CreateClusterRequest;
import com.school.dolphin.organization.service.ClusterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ClusterResponse create(
            @Valid @RequestBody CreateClusterRequest request
    ) {
        return clusterService.create(request);
    }

    @GetMapping("/{id}")
    public ClusterResponse getById(
            @PathVariable UUID id
    ) {
        return clusterService.getById(id);
    }

    @GetMapping("/by-region/{regionId}")
    public List<ClusterResponse> getByRegion(
            @PathVariable UUID regionId
    ) {
        return clusterService.getByRegion(regionId);
    }
}