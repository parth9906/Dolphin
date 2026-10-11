package com.school.dolphin.hostel.repository;

import java.util.UUID;

public interface RoomOccupancyProjection {

    UUID getRoomId();

    Long getOccupied();
}
