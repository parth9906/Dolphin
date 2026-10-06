package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.CreateInstitutionRequest;
import com.school.dolphin.organization.dto.InstitutionResponse;
import com.school.dolphin.organization.service.InstitutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionResponse create(
            @Valid @RequestBody CreateInstitutionRequest request
    ) {
        return institutionService.create(request);
    }

    @GetMapping("/{id}")
    public InstitutionResponse getById(
            @PathVariable UUID id
    ) {
        return institutionService.getById(id);
    }
}