package com.school.dolphin.calendar.controller;

import com.school.dolphin.calendar.dto.CalendarEventResponse;
import com.school.dolphin.calendar.dto.CreateCalendarEventRequest;
import com.school.dolphin.calendar.dto.UpdateCalendarEventRequest;
import com.school.dolphin.calendar.entity.CalendarEventType;
import com.school.dolphin.calendar.service.CalendarEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar-events")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @PostMapping
    @PreAuthorize("hasAuthority('CALENDAR_EVENT_CREATE')")
    public CalendarEventResponse create(
            @Valid @RequestBody CreateCalendarEventRequest request,
            Authentication authentication
    ) {
        return calendarEventService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CALENDAR_EVENT_READ')")
    public Page<CalendarEventResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) CalendarEventType eventType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "startDate") Pageable pageable,
            Authentication authentication
    ) {
        return calendarEventService.search(
                institutionId,
                campusId,
                eventType,
                fromDate,
                toDate,
                pageable,
                authentication);
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("hasAuthority('CALENDAR_EVENT_READ')")
    public CalendarEventResponse getById(
            @PathVariable UUID eventId,
            Authentication authentication
    ) {
        return calendarEventService.getById(eventId, authentication);
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAuthority('CALENDAR_EVENT_UPDATE')")
    public CalendarEventResponse update(
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateCalendarEventRequest request,
            Authentication authentication
    ) {
        return calendarEventService.update(eventId, request, authentication);
    }

    @PostMapping("/{eventId}/deactivate")
    @PreAuthorize("hasAuthority('CALENDAR_EVENT_DEACTIVATE')")
    public CalendarEventResponse deactivate(
            @PathVariable UUID eventId,
            Authentication authentication
    ) {
        return calendarEventService.deactivate(eventId, authentication);
    }
}
