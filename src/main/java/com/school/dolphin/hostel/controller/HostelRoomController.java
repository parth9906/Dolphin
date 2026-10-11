package com.school.dolphin.hostel.controller;

import com.school.dolphin.hostel.dto.CreateHostelRoomRequest;
import com.school.dolphin.hostel.dto.HostelRoomResponse;
import com.school.dolphin.hostel.dto.UpdateHostelRoomRequest;
import com.school.dolphin.hostel.entity.HostelRoomType;
import com.school.dolphin.hostel.service.HostelRoomService;
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
@RequestMapping("/api/v1/hostels/{hostelId}/rooms")
@RequiredArgsConstructor
public class HostelRoomController {

    private final HostelRoomService hostelRoomService;

    @PostMapping
    @PreAuthorize("hasAuthority('HOSTEL_ROOM_CREATE')")
    public HostelRoomResponse create(
            @PathVariable UUID hostelId,
            @Valid @RequestBody CreateHostelRoomRequest request,
            Authentication authentication
    ) {
        return hostelRoomService.create(hostelId, request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('HOSTEL_ROOM_READ')")
    public Page<HostelRoomResponse> search(
            @PathVariable UUID hostelId,
            @RequestParam(required = false) HostelRoomType roomType,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "roomNumber")
                    Pageable pageable,
            Authentication authentication
    ) {
        return hostelRoomService.search(
                hostelId, roomType, active, pageable, authentication);
    }

    @GetMapping("/{roomId}")
    @PreAuthorize("hasAuthority('HOSTEL_ROOM_READ')")
    public HostelRoomResponse getById(
            @PathVariable UUID hostelId,
            @PathVariable UUID roomId,
            Authentication authentication
    ) {
        return hostelRoomService.getById(hostelId, roomId, authentication);
    }

    @PutMapping("/{roomId}")
    @PreAuthorize("hasAuthority('HOSTEL_ROOM_UPDATE')")
    public HostelRoomResponse update(
            @PathVariable UUID hostelId,
            @PathVariable UUID roomId,
            @Valid @RequestBody UpdateHostelRoomRequest request,
            Authentication authentication
    ) {
        return hostelRoomService.update(
                hostelId, roomId, request, authentication);
    }

    @PatchMapping("/{roomId}/deactivate")
    @PreAuthorize("hasAuthority('HOSTEL_ROOM_UPDATE')")
    public HostelRoomResponse deactivate(
            @PathVariable UUID hostelId,
            @PathVariable UUID roomId,
            Authentication authentication
    ) {
        return hostelRoomService.deactivate(
                hostelId, roomId, authentication);
    }
}
