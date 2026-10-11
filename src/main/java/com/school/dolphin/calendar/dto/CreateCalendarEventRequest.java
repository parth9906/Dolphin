package com.school.dolphin.calendar.dto;

import com.school.dolphin.calendar.entity.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateCalendarEventRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull CalendarEventType eventType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime
) {}
