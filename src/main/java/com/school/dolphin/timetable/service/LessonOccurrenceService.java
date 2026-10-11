package com.school.dolphin.timetable.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.repository.StaffLeaveRequestRepository;
import com.school.dolphin.academic.entity.ClassSection;
import com.school.dolphin.academic.repository.ClassSectionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.timetable.entity.LessonOccurrence;
import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;
import com.school.dolphin.timetable.entity.ScheduledLesson;
import com.school.dolphin.timetable.dto.LessonOccurrenceResponse;
import com.school.dolphin.timetable.repository.LessonOccurrenceRepository;
import com.school.dolphin.timetable.repository.ScheduledLessonRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LessonOccurrenceService {

    private static final long MAX_GENERATION_DAYS = 366;

    private final ScheduledLessonRepository scheduledLessonRepository;
    private final LessonOccurrenceRepository occurrenceRepository;
    private final StaffLeaveRequestRepository staffLeaveRequestRepository;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;
    private final ClassSectionRepository sectionRepository;

    @Transactional
    public int generateForSection(
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        requireSectionInstitutionAccess(authentication, sectionId);

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "A valid occurrence generation date range is required");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (days > MAX_GENERATION_DAYS) {
            throw new BusinessRuleViolationException(
                    "Occurrences can be generated for at most 366 days at a time");
        }

        List<ScheduledLesson> lessons =
                scheduledLessonRepository.findBySection_IdAndActiveTrue(sectionId);

        int created = 0;

        for (LocalDate date = startDate;
             !date.isAfter(endDate);
             date = date.plusDays(1)) {

            int dayOfWeek = date.getDayOfWeek().getValue();

            for (ScheduledLesson lesson : lessons) {
                if (!lesson.getSlot().isActive()
                        || lesson.getSlot().getDayOfWeek() != dayOfWeek) {
                    continue;
                }

                boolean exists = occurrenceRepository
                        .existsByScheduledLesson_IdAndLessonDate(
                                lesson.getId(), date);

                if (!exists) {
                    boolean teacherOnLeave =
                            staffLeaveRequestRepository
                                    .existsByStaffMember_IdAndInstitution_IdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                            lesson.getTeacherAssignment()
                                                    .getStaffMember().getId(),
                                            lesson.getSection()
                                                    .getSchoolClass()
                                                    .getAcademicYear()
                                                    .getInstitution()
                                                    .getId(),
                                            LeaveRequestStatus.APPROVED,
                                            date,
                                            date);

                    LessonOccurrence occurrence =
                            new LessonOccurrence(lesson, date);

                    if (teacherOnLeave) {
                        occurrence.markNeedsCoverage();
                    }

                    occurrenceRepository.save(occurrence);
                    created++;
                }
            }
        }


        return created;
    }

    @Transactional(readOnly = true)
    public List<LessonOccurrenceResponse> getSectionOccurrences(
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        requireSectionInstitutionAccess(authentication, sectionId);

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "A valid occurrence query date range is required");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (days > MAX_GENERATION_DAYS) {
            throw new BusinessRuleViolationException(
                    "The occurrence query range cannot exceed 366 days");
        }

        return occurrenceRepository
                .findByScheduledLesson_Section_IdAndLessonDateBetweenOrderByLessonDateAsc(
                        sectionId, startDate, endDate)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public int markTeacherLeave(
            UUID teacherAssignmentId,
            LocalDate startDate,
            LocalDate endDate) {

        return occurrenceRepository.updateStatusForTeacherDateRange(
                teacherAssignmentId,
                startDate,
                endDate,
                LessonOccurrenceStatus.SCHEDULED,
                LessonOccurrenceStatus.NEEDS_COVERAGE);
    }

    @Transactional(readOnly = true)
    public List<LessonOccurrenceResponse> getCoverageOccurrences(
            UUID institutionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        if (institutionId == null || startDate == null || endDate == null) {
            throw new BusinessRuleViolationException(
                    "Institution, start date, and end date are required");
        }

        if (endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "End date must be on or after start date");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (days > MAX_GENERATION_DAYS) {
            throw new BusinessRuleViolationException(
                    "The coverage query range cannot exceed 366 days");
        }

        return occurrenceRepository.findCoverageOccurrences(
                        institutionId,
                        startDate,
                        endDate,
                        List.of(
                                LessonOccurrenceStatus.NEEDS_COVERAGE,
                                LessonOccurrenceStatus.COVERAGE_ASSIGNED))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LessonOccurrenceResponse toResponse(LessonOccurrence occurrence) {
        ScheduledLesson lesson = occurrence.getScheduledLesson();

        return new LessonOccurrenceResponse(
                occurrence.getId(),
                lesson.getId(),
                lesson.getSection().getId(),
                lesson.getTeacherAssignment().getId(),
                lesson.getSubject().getId(),
                lesson.getRoom() == null ? null : lesson.getRoom().getId(),
                occurrence.getLessonDate(),
                lesson.getSlot().getStartTime(),
                lesson.getSlot().getEndTime(),
                occurrence.getStatus(),
                occurrence.getSubstituteStaffAssignment() == null
                        ? null
                        : occurrence.getSubstituteStaffAssignment().getId()
        );
    }

    private void requireSectionInstitutionAccess(
            Authentication authentication,
            UUID sectionId
    ) {
        ClassSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section not found"));

        UUID institutionId = section.getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }
    }
}

