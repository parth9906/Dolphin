package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.HostelRoom;
import com.school.dolphin.hostel.entity.HostelRoomType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record HostelRoomResponse(
        UUID id,
        UUID hostelId,
        String roomNumber,
        Integer floor,
        HostelRoomType roomType,
        int capacity,
        long occupied,
        long available,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Long version
) {
    public static HostelRoomResponse from(HostelRoom room, long occupied) {
        return new HostelRoomResponse(
                room.getId(),
                room.getHostel().getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getRoomType(),
                room.getCapacity(),
                occupied,
                Math.max(0L, room.getCapacity() - occupied),
                room.isActive(),
                room.getCreatedAt(),
                room.getUpdatedAt(),
                room.getVersion()
        );
    }
}
