package com.school.dolphin.hostel.controller;

import com.school.dolphin.hostel.dto.CreateHostelAllocationRequest;
import com.school.dolphin.hostel.dto.HostelAllocationResponse;
import com.school.dolphin.hostel.dto.VacateHostelAllocationRequest;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import com.school.dolphin.hostel.service.HostelAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hostels/{hostelId}/allocations")
@RequiredArgsConstructor
public class HostelAllocationController {

    private final HostelAllocationService hostelAllocationService;

    @PostMapping
    @PreAuthorize("hasAuthority('HOSTEL_ALLOCATION_CREATE')")
    public HostelAllocationResponse create(
            @PathVariable UUID hostelId,
            @Valid @RequestBody CreateHostelAllocationRequest request,
            Authentication authentication
    ) {
        return hostelAllocationService.create(
                hostelId, request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('HOSTEL_ALLOCATION_READ')")
    public Page<HostelAllocationResponse> search(
            @PathVariable UUID hostelId,
            @RequestParam(required = false) UUID roomId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) HostelAllocationStatus status,
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication
    ) {
        return hostelAllocationService.search(
                hostelId, roomId, studentId, status, pageable, authentication);
    }

    @GetMapping("/{allocationId}")
    @PreAuthorize("hasAuthority('HOSTEL_ALLOCATION_READ')")
    public HostelAllocationResponse getById(
            @PathVariable UUID hostelId,
            @PathVariable UUID allocationId,
            Authentication authentication
    ) {
        return hostelAllocationService.getById(
                hostelId, allocationId, authentication);
    }

    @PatchMapping("/{allocationId}/vacate")
    @PreAuthorize("hasAuthority('HOSTEL_ALLOCATION_UPDATE')")
    public HostelAllocationResponse vacate(
            @PathVariable UUID hostelId,
            @PathVariable UUID allocationId,
            @Valid @RequestBody VacateHostelAllocationRequest request,
            Authentication authentication
    ) {
        return hostelAllocationService.vacate(
                hostelId, allocationId, request, authentication);
    }
}
