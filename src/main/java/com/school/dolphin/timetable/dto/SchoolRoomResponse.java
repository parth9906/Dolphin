package com.school.dolphin.timetable.dto;


import java.util.UUID;

public record SchoolRoomResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String code,
        String name,
        Integer capacity,
        boolean active
) {}
