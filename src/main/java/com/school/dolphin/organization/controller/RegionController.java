package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.CreateRegionRequest;
import com.school.dolphin.organization.dto.RegionResponse;
import com.school.dolphin.organization.service.RegionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REGION_CREATE')")
    public RegionResponse create(
            @Valid @RequestBody CreateRegionRequest request,
            Authentication authentication
    ) {
        return regionService.create(request, authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('REGION_READ')")
    public RegionResponse getById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return regionService.getById(id, authentication);
    }

    @GetMapping("/by-enterprise/{enterpriseId}")
    @PreAuthorize("hasAuthority('REGION_READ')")
    public List<RegionResponse> getByEnterprise(
            @PathVariable UUID enterpriseId,
            Authentication authentication
    ) {
        return regionService.getByEnterprise(enterpriseId, authentication);
    }
}
