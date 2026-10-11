package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.CreateEnterpriseRequest;
import com.school.dolphin.organization.dto.EnterpriseResponse;
import com.school.dolphin.organization.service.EnterpriseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enterprises")
@RequiredArgsConstructor
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ENTERPRISE_CREATE')")
    public EnterpriseResponse create(
            @Valid @RequestBody CreateEnterpriseRequest request
    ) {
        return enterpriseService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ENTERPRISE_READ')")
    public EnterpriseResponse getById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return enterpriseService.getById(id, authentication);
    }
}
