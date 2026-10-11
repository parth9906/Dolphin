package com.school.dolphin.calendar.service;

import com.school.dolphin.calendar.dto.CalendarEventResponse;
import com.school.dolphin.calendar.dto.CreateCalendarEventRequest;
import com.school.dolphin.calendar.dto.UpdateCalendarEventRequest;
import com.school.dolphin.calendar.entity.CalendarEvent;
import com.school.dolphin.calendar.entity.CalendarEventType;
import com.school.dolphin.calendar.repository.CalendarEventRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private static final int MAX_PAGE_SIZE = 100;

    private final CalendarEventRepository calendarEventRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public CalendarEventResponse create(
            CreateCalendarEventRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an event for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId());

        requireValidDateRange(request.startDate(), request.endDate());
        requireValidTimeRange(request.startTime(), request.endTime());

        UserAccount creator =
                authenticatedUserResolver.requireUserAccount(authentication);

        CalendarEvent event = CalendarEvent.builder()
                .institution(institution)
                .campus(campus)
                .title(request.title().trim())
                .description(normalize(request.description()))
                .eventType(request.eventType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .active(true)
                .createdBy(creator)
                .build();

        return toResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse update(
            UUID eventId,
            UpdateCalendarEventRequest request,
            Authentication authentication
    ) {
        CalendarEvent event = requireActiveEvent(eventId);

        requireInstitutionAccess(
                authentication, event.getInstitution().getId());

        Campus campus = resolveCampus(
                request.campusId(), event.getInstitution().getId());

        requireValidDateRange(request.startDate(), request.endDate());
        requireValidTimeRange(request.startTime(), request.endTime());

        event.setCampus(campus);
        event.setTitle(request.title().trim());
        event.setDescription(normalize(request.description()));
        event.setEventType(request.eventType());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        return toResponse(calendarEventRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse deactivate(
            UUID eventId,
            Authentication authentication
    ) {
        CalendarEvent event = requireActiveEvent(eventId);

        requireInstitutionAccess(
                authentication, event.getInstitution().getId());

        event.setActive(false);

        return toResponse(calendarEventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public CalendarEventResponse getById(
            UUID eventId,
            Authentication authentication
    ) {
        CalendarEvent event = requireActiveEvent(eventId);

        requireInstitutionAccess(
                authentication, event.getInstitution().getId());

        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> search(
            UUID institutionId,
            UUID campusId,
            CalendarEventType eventType,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable,
            Authentication authentication
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessRuleViolationException(
                    "fromDate must not be after toDate");
        }

        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        requireInstitutionAccess(authentication, institutionId);

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return calendarEventRepository
                .search(
                        institutionId,
                        campusId,
                        eventType,
                        fromDate,
                        toDate,
                        pageable)
                .map(this::toResponse);
    }

    private CalendarEvent requireActiveEvent(UUID eventId) {
        return calendarEventRepository
                .findByIdAndActiveTrue(eventId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Calendar event not found"));
    }

    private Campus resolveCampus(
            UUID campusId,
            UUID institutionId
    ) {
        if (campusId == null) {
            return null;
        }

        Campus campus = requireCampusInInstitution(campusId, institutionId);

        if (!campus.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot schedule an event for an inactive campus");
        }

        return campus;
    }

    private Campus requireCampusInInstitution(
            UUID campusId,
            UUID institutionId
    ) {
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Campus not found"));

        if (!campus.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Campus does not belong to the requested institution");
        }

        return campus;
    }

    private void requireValidDateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "Event end date cannot be before its start date");
        }
    }

    private void requireValidTimeRange(
            LocalTime startTime,
            LocalTime endTime
    ) {
        if (startTime == null && endTime == null) {
            return;
        }

        if (startTime == null || endTime == null) {
            throw new BusinessRuleViolationException(
                    "Event times must set both start and end, or neither");
        }

        if (!startTime.isBefore(endTime)) {
            throw new BusinessRuleViolationException(
                    "Event end time must be after its start time");
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

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private CalendarEventResponse toResponse(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getInstitution().getId(),
                event.getCampus() == null
                        ? null : event.getCampus().getId(),
                event.getTitle(),
                event.getDescription(),
                event.getEventType(),
                event.getStartDate(),
                event.getEndDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.isActive(),
                event.getCreatedBy().getId(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
