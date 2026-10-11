package com.school.dolphin.timetable.dto;


import java.time.LocalTime;
import java.util.UUID;

public record TimetableSlotResponse(
        UUID id,
        UUID academicYearId,
        int dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        String label,
        boolean active
) {}
