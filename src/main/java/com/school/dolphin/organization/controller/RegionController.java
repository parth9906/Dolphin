package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.CreateRegionRequest;
import com.school.dolphin.organization.dto.RegionResponse;
import com.school.dolphin.organization.service.RegionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public RegionResponse create(
            @Valid @RequestBody CreateRegionRequest request
    ) {
        return regionService.create(request);
    }

    @GetMapping("/{id}")
    public RegionResponse getById(
            @PathVariable UUID id
    ) {
        return regionService.getById(id);
    }

    @GetMapping("/by-enterprise/{enterpriseId}")
    public List<RegionResponse> getByEnterprise(
            @PathVariable UUID enterpriseId
    ) {
        return regionService.getByEnterprise(enterpriseId);
    }
}