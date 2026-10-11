package com.school.dolphin.calendar.dto;

import com.school.dolphin.calendar.entity.CalendarEventType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CalendarEventResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String title,
        String description,
        CalendarEventType eventType,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        boolean active,
        UUID createdByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
