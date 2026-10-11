package com.school.dolphin.hostel.controller;

import com.school.dolphin.hostel.dto.CreateHostelRequest;
import com.school.dolphin.hostel.dto.HostelResponse;
import com.school.dolphin.hostel.dto.UpdateHostelRequest;
import com.school.dolphin.hostel.service.HostelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hostels")
@RequiredArgsConstructor
public class HostelController {

    private final HostelService hostelService;

    @PostMapping
    @PreAuthorize("hasAuthority('HOSTEL_CREATE')")
    public HostelResponse create(
            @Valid @RequestBody CreateHostelRequest request,
            Authentication authentication
    ) {
        return hostelService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('HOSTEL_READ')")
    public Page<HostelResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "name") Pageable pageable,
            Authentication authentication
    ) {
        return hostelService.search(
                institutionId, campusId, active, pageable, authentication);
    }

    @GetMapping("/{hostelId}")
    @PreAuthorize("hasAuthority('HOSTEL_READ')")
    public HostelResponse getById(
            @PathVariable UUID hostelId,
            Authentication authentication
    ) {
        return hostelService.getById(hostelId, authentication);
    }

    @PutMapping("/{hostelId}")
    @PreAuthorize("hasAuthority('HOSTEL_UPDATE')")
    public HostelResponse update(
            @PathVariable UUID hostelId,
            @Valid @RequestBody UpdateHostelRequest request,
            Authentication authentication
    ) {
        return hostelService.update(hostelId, request, authentication);
    }

    @PatchMapping("/{hostelId}/deactivate")
    @PreAuthorize("hasAuthority('HOSTEL_UPDATE')")
    public HostelResponse deactivate(
            @PathVariable UUID hostelId,
            Authentication authentication
    ) {
        return hostelService.deactivate(hostelId, authentication);
    }
}
