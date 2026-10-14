package com.school.dolphin.organization.controller;

import com.school.dolphin.organization.dto.CampusResponse;
import com.school.dolphin.organization.dto.CreateCampusRequest;
import com.school.dolphin.organization.service.CampusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campuses")
@RequiredArgsConstructor
public class CampusController {

    private final CampusService campusService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CAMPUS_CREATE')")
    public CampusResponse create(
            @Valid @RequestBody CreateCampusRequest request,
            Authentication authentication
    ) {
        return campusService.create(request, authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CAMPUS_READ')")
    public CampusResponse getById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return campusService.getById(id, authentication);
    }

    @GetMapping("/by-institution/{institutionId}")
    @PreAuthorize("hasAuthority('CAMPUS_READ')")
    public List<CampusResponse> getByInstitution(
            @PathVariable UUID institutionId,
            Authentication authentication
    ) {
        return campusService.getByInstitution(
                institutionId, authentication
        );
    }
}
