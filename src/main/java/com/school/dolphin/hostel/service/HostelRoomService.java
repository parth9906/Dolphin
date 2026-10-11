package com.school.dolphin.hostel.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.hostel.dto.CreateHostelRoomRequest;
import com.school.dolphin.hostel.dto.HostelRoomResponse;
import com.school.dolphin.hostel.dto.UpdateHostelRoomRequest;
import com.school.dolphin.hostel.entity.Hostel;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import com.school.dolphin.hostel.entity.HostelRoom;
import com.school.dolphin.hostel.entity.HostelRoomType;
import com.school.dolphin.hostel.repository.HostelAllocationRepository;
import com.school.dolphin.hostel.repository.HostelRepository;
import com.school.dolphin.hostel.repository.HostelRoomRepository;
import com.school.dolphin.hostel.repository.RoomOccupancyProjection;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HostelRoomService {

    private static final int MAX_PAGE_SIZE = 100;

    private final HostelRepository hostelRepository;
    private final HostelRoomRepository hostelRoomRepository;
    private final HostelAllocationRepository hostelAllocationRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public HostelRoomResponse create(
            UUID hostelId,
            CreateHostelRoomRequest request,
            Authentication authentication
    ) {
        Hostel hostel = requireActiveHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        String roomNumber = request.roomNumber().trim();

        if (hostelRoomRepository
                .existsByHostel_IdAndRoomNumberIgnoreCase(
                        hostelId, roomNumber)) {
            throw new DuplicateResourceException(
                    "A room with this number already exists in the hostel");
        }

        HostelRoom room = HostelRoom.builder()
                .hostel(hostel)
                .roomNumber(roomNumber)
                .floor(request.floor())
                .roomType(request.roomType())
                .capacity(request.capacity())
                .active(true)
                .build();

        return HostelRoomResponse.from(
                hostelRoomRepository.save(room), 0);
    }

    @Transactional
    public HostelRoomResponse update(
            UUID hostelId,
            UUID roomId,
            UpdateHostelRoomRequest request,
            Authentication authentication
    ) {
        HostelRoom room = requireRoomForUpdate(hostelId, roomId);

        requireInstitutionAccess(
                authentication, room.getHostel().getInstitution().getId());

        if (!room.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot update an inactive hostel room");
        }

        ensureVersion(room, request.version());

        String roomNumber = request.roomNumber().trim();

        if (!roomNumber.equalsIgnoreCase(room.getRoomNumber())
                && hostelRoomRepository
                .existsByHostel_IdAndRoomNumberIgnoreCase(
                        hostelId, roomNumber)) {
            throw new DuplicateResourceException(
                    "A room with this number already exists in the hostel");
        }

        long occupied = countOccupied(roomId);

        if (request.capacity() < occupied) {
            throw new BusinessRuleViolationException(
                    "Capacity cannot be reduced below the current "
                            + "occupancy of " + occupied);
        }

        room.setRoomNumber(roomNumber);
        room.setFloor(request.floor());
        room.setRoomType(request.roomType());
        room.setCapacity(request.capacity());

        return HostelRoomResponse.from(
                hostelRoomRepository.save(room), occupied);
    }

    @Transactional
    public HostelRoomResponse deactivate(
            UUID hostelId,
            UUID roomId,
            Authentication authentication
    ) {
        HostelRoom room = requireRoomForUpdate(hostelId, roomId);

        requireInstitutionAccess(
                authentication, room.getHostel().getInstitution().getId());

        if (!room.isActive()) {
            throw new BusinessRuleViolationException(
                    "Hostel room is already inactive");
        }

        long occupied = countOccupied(roomId);

        if (occupied > 0) {
            throw new BusinessRuleViolationException(
                    "Cannot deactivate a room with active allocations");
        }

        room.setActive(false);

        return HostelRoomResponse.from(
                hostelRoomRepository.save(room), occupied);
    }

    @Transactional(readOnly = true)
    public HostelRoomResponse getById(
            UUID hostelId,
            UUID roomId,
            Authentication authentication
    ) {
        HostelRoom room = requireRoom(hostelId, roomId);

        requireInstitutionAccess(
                authentication, room.getHostel().getInstitution().getId());

        return HostelRoomResponse.from(room, countOccupied(roomId));
    }

    @Transactional(readOnly = true)
    public Page<HostelRoomResponse> search(
            UUID hostelId,
            HostelRoomType roomType,
            Boolean active,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        Hostel hostel = requireHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        Page<HostelRoom> rooms = hostelRoomRepository.search(
                hostelId, roomType, active, pageable);

        Map<UUID, Long> occupiedByRoom = occupancyForPage(rooms.getContent());

        return rooms.map(room -> HostelRoomResponse.from(
                room, occupiedByRoom.getOrDefault(room.getId(), 0L)));
    }

    private Map<UUID, Long> occupancyForPage(List<HostelRoom> rooms) {
        if (rooms.isEmpty()) {
            return Map.of();
        }

        List<UUID> roomIds = rooms.stream()
                .map(HostelRoom::getId)
                .toList();

        return hostelAllocationRepository
                .countByRoomIdsAndStatus(
                        roomIds, HostelAllocationStatus.ACTIVE)
                .stream()
                .collect(Collectors.toMap(
                        RoomOccupancyProjection::getRoomId,
                        RoomOccupancyProjection::getOccupied,
                        (left, right) -> left));
    }

    private long countOccupied(UUID roomId) {
        return hostelAllocationRepository.countByRoom_IdAndStatus(
                roomId, HostelAllocationStatus.ACTIVE);
    }

    private Hostel requireHostel(UUID hostelId) {
        return hostelRepository.findById(hostelId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hostel not found"));
    }

    private Hostel requireActiveHostel(UUID hostelId) {
        Hostel hostel = requireHostel(hostelId);

        if (!hostel.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot add rooms to an inactive hostel");
        }

        return hostel;
    }

    private HostelRoom requireRoom(UUID hostelId, UUID roomId) {
        return hostelRoomRepository
                .findByIdAndHostel_Id(roomId, hostelId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Hostel room not found"));
    }

    /**
     * Loads the room under a pessimistic write lock so a concurrent allocation
     * cannot slip past the capacity/occupancy checks in update/deactivate.
     */
    private HostelRoom requireRoomForUpdate(UUID hostelId, UUID roomId) {
        HostelRoom room = hostelRoomRepository
                .findByIdForUpdate(roomId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Hostel room not found"));

        if (!room.getHostel().getId().equals(hostelId)) {
            throw new ResourceNotFoundException("Hostel room not found");
        }

        return room;
    }

    private void ensureVersion(HostelRoom room, Long version) {
        if (version == null || !version.equals(room.getVersion())) {
            throw new StaleResourceVersionException(
                    "The hostel room was modified by another request. "
                            + "Reload it and try again.");
        }
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }
}
