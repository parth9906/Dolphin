package com.school.dolphin.attendance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.school.dolphin.attendance.dto.*;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.dolphin.academic.repository.StudentEnrollmentRepository;
import com.school.dolphin.attendance.entity.LessonAttendanceAudit;
import com.school.dolphin.attendance.entity.LessonAttendanceRecord;
import com.school.dolphin.attendance.entity.LessonAttendanceStatus;
import com.school.dolphin.attendance.repository.LessonAttendanceAuditRepository;
import com.school.dolphin.attendance.repository.LessonAttendanceRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.timetable.entity.LessonOccurrence;
import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;
import com.school.dolphin.timetable.repository.LessonOccurrenceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LessonAttendanceService {

    private final LessonAttendanceRepository attendanceRepository;
    private final LessonAttendanceAuditRepository auditRepository;
    private final LessonOccurrenceRepository occurrenceRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;

    @Transactional(readOnly = true)
    public List<LessonAttendanceResponse> getAttendance(
            UUID occurrenceId,
            Authentication authentication) {

        LessonOccurrence occurrence = getAuthorizedOccurrence(
                occurrenceId, authentication);

        return attendanceRepository
                .findRecordsWithStudent(occurrence.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<LessonAttendanceResponse> markAttendance(
            UUID occurrenceId,
            MarkLessonAttendanceRequest request,
            Authentication authentication) {

        LessonOccurrence occurrence = getAuthorizedOccurrence(
                occurrenceId, authentication);

        validateOccurrenceCanBeMarked(occurrence);

        UserAccount currentUser = getAuthenticatedUser(authentication);

        List<Student> roster =
                enrollmentRepository.findActiveRosterForSectionOnDate(
                        occurrence.getScheduledLesson().getSection().getId(),
                        occurrence.getLessonDate());

        Set<UUID> rosterIds = roster.stream()
                .map(Student::getId)
                .collect(Collectors.toSet());

        Set<UUID> requestIds = new HashSet<>();

        for (LessonAttendanceItemRequest item : request.records()) {
            if (!requestIds.add(item.studentId())) {
                throw new BusinessRuleViolationException(
                        "A student can appear only once in an attendance batch");
            }

            if (!rosterIds.contains(item.studentId())) {
                throw new BusinessRuleViolationException(
                        "Student " + item.studentId()
                                + " is not actively enrolled in this section on the lesson date");
            }

            if (attendanceRepository.existsByLessonOccurrence_IdAndStudent_Id(
                    occurrenceId, item.studentId())) {
                throw new DuplicateResourceException(
                        "Attendance has already been recorded for student "
                                + item.studentId()
                                + " in this lesson");
            }
        }

        List<LessonAttendanceRecord> saved = request.records()
                .stream()
                .map(item -> {
                    Student student = roster.stream()
                            .filter(s -> s.getId().equals(item.studentId()))
                            .findFirst()
                            .orElseThrow();

                    LessonAttendanceRecord record =
                            new LessonAttendanceRecord(
                                    occurrence,
                                    student,
                                    item.status(),
                                    currentUser,
                                    item.remarks());

                    LessonAttendanceRecord persisted =
                            attendanceRepository.save(record);

                    auditRepository.save(new LessonAttendanceAudit(
                            persisted,
                            null,
                            item.status(),
                            null,
                            item.remarks(),
                            currentUser));

                    return persisted;
                })
                .toList();

        return saved.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LessonAttendanceResponse correctAttendance(
            UUID attendanceRecordId,
            CorrectLessonAttendanceRequest request,
            Authentication authentication) {

        LessonAttendanceRecord record = attendanceRepository
                .findByIdForUpdate(attendanceRecordId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson attendance record not found"));

        LessonOccurrence occurrence = record.getLessonOccurrence();

        authorizeInstitution(
                authentication,
                occurrence.getScheduledLesson()
                        .getSection()
                        .getSchoolClass()
                        .getAcademicYear()
                        .getInstitution()
                        .getId());

        UserAccount currentUser = getAuthenticatedUser(authentication);

        LessonAttendanceStatus previousStatus = record.getStatus();
        String previousRemarks = record.getRemarks();

        record.correct(
                request.status(),
                currentUser,
                request.remarks());

        LessonAttendanceRecord saved = attendanceRepository.save(record);

        auditRepository.save(new LessonAttendanceAudit(
                saved,
                previousStatus,
                request.status(),
                previousRemarks,
                request.remarks(),
                currentUser));

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LessonAttendanceAuditResponse> getAuditHistory(
            UUID attendanceRecordId,
            Authentication authentication) {

        LessonAttendanceRecord record = attendanceRepository
                .findById(attendanceRecordId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson attendance record not found"));

        LessonOccurrence occurrence = record.getLessonOccurrence();

        authorizeInstitution(
                authentication,
                occurrence.getScheduledLesson()
                        .getSection()
                        .getSchoolClass()
                        .getAcademicYear()
                        .getInstitution()
                        .getId());

        return auditRepository
                .findByAttendanceRecord_IdOrderByChangedAtDesc(
                        attendanceRecordId)
                .stream()
                .map(audit -> new LessonAttendanceAuditResponse(
                        audit.getId(),
                        attendanceRecordId,
                        audit.getPreviousStatus() == null
                                ? null
                                : LessonAttendanceStatus.valueOf(
                                audit.getPreviousStatus()),
                        LessonAttendanceStatus.valueOf(
                                audit.getNewStatus()),
                        audit.getPreviousRemarks(),
                        audit.getNewRemarks(),
                        audit.getChangedBy().getId(),
                        audit.getChangedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LessonAttendanceRosterItemResponse> getRoster(
            UUID occurrenceId,
            Authentication authentication) {

        LessonOccurrence occurrence = getAuthorizedOccurrence(
                occurrenceId, authentication);

        List<Student> roster =
                enrollmentRepository.findActiveRosterForSectionOnDate(
                        occurrence.getScheduledLesson().getSection().getId(),
                        occurrence.getLessonDate());

        Map<UUID, LessonAttendanceRecord> attendanceByStudent =
                attendanceRepository.findRecordsWithStudent(occurrenceId)
                        .stream()
                        .collect(Collectors.toMap(
                                record -> record.getStudent().getId(),
                                Function.identity()));

        return roster.stream()
                .map(student -> {
                    LessonAttendanceRecord record =
                            attendanceByStudent.get(student.getId());

                    return new LessonAttendanceRosterItemResponse(
                            student.getId(),
                            student.getFirstName() + " " + student.getLastName(),
                            record == null ? null : record.getId(),
                            record == null ? null : record.getStatus(),
                            record == null ? null : record.getRemarks());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentAttendanceAnalyticsResponse> getStudentAnalytics(
            UUID institutionId,
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        validateAnalyticsRange(startDate, endDate);
        authorizeInstitution(authentication, institutionId);

        return attendanceRepository.findStudentAttendanceAnalytics(
                        institutionId,
                        sectionId,
                        startDate,
                        endDate)
                .stream()
                .map(this::toStudentAnalyticsResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<AttendanceGroupAnalyticsResponse> getSectionAnalytics(
            UUID institutionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        validateAnalyticsRange(startDate, endDate);
        authorizeInstitution(authentication, institutionId);

        return attendanceRepository.findSectionAttendanceAnalytics(
                        institutionId,
                        startDate,
                        endDate)
                .stream()
                .map(this::toGroupAnalyticsResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<AttendanceGroupAnalyticsResponse> getSubjectAnalytics(
            UUID institutionId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        validateAnalyticsRange(startDate, endDate);
        authorizeInstitution(authentication, institutionId);

        return attendanceRepository.findSubjectAttendanceAnalytics(
                        institutionId,
                        startDate,
                        endDate)
                .stream()
                .map(this::toGroupAnalyticsResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<StudentAttendanceAnalyticsResponse> getLowAttendanceStudents(
            UUID institutionId,
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal threshold,
            Authentication authentication) {

        if (threshold == null
                || threshold.compareTo(BigDecimal.ZERO) < 0
                || threshold.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessRuleViolationException(
                    "Attendance threshold must be between 0 and 100");
        }

        return getStudentAnalytics(
                institutionId,
                sectionId,
                startDate,
                endDate,
                authentication)
                .stream()
                .filter(result -> result.eligibleLessons() > 0)
                .filter(result ->
                        result.attendancePercentage().compareTo(threshold) < 0)
                .toList();
    }


    private StudentAttendanceAnalyticsResponse toStudentAnalyticsResponse(
            StudentAttendanceAggregate aggregate) {

        long attended = aggregate.attendedLessons();
        long eligible = aggregate.eligibleLessons();
        long excused = aggregate.excusedLessons();

        return new StudentAttendanceAnalyticsResponse(
                aggregate.studentId(),
                aggregate.studentName(),
                attended,
                eligible - attended,
                excused,
                eligible,
                calculatePercentage(attended, eligible));
    }


    private AttendanceGroupAnalyticsResponse toGroupAnalyticsResponse(
            AttendanceGroupAggregate aggregate) {

        long attended = aggregate.attendedLessons();
        long eligible = aggregate.eligibleLessons();
        long excused = aggregate.excusedLessons();

        return new AttendanceGroupAnalyticsResponse(
                aggregate.groupId(),
                aggregate.groupName(),
                attended,
                eligible - attended,
                excused,
                eligible,
                calculatePercentage(attended, eligible));
    }


    private BigDecimal calculatePercentage(long attended, long eligible) {
        if (eligible == 0) {
            return BigDecimal.ZERO.setScale(2);
        }

        return BigDecimal.valueOf(attended)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(eligible), 2, RoundingMode.HALF_UP);
    }


    private void validateAnalyticsRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "A valid analytics date range is required");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (days > 366) {
            throw new BusinessRuleViolationException(
                    "Attendance analytics supports a maximum range of 366 days");
        }
    }

    private LessonOccurrence getAuthorizedOccurrence(
            UUID occurrenceId,
            Authentication authentication) {

        LessonOccurrence occurrence = occurrenceRepository
                .findById(occurrenceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson occurrence not found"));

        UUID institutionId = occurrence.getScheduledLesson()
                .getSection()
                .getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        authorizeInstitution(authentication, institutionId);

        return occurrence;
    }

    private void authorizeInstitution(
            Authentication authentication,
            UUID institutionId) {

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }
    }

    private void validateOccurrenceCanBeMarked(
            LessonOccurrence occurrence) {

        LessonOccurrenceStatus status = occurrence.getStatus();

        if (status == LessonOccurrenceStatus.CANCELLED) {
            throw new BusinessRuleViolationException(
                    "Attendance cannot be recorded for a cancelled lesson");
        }

        if (status == LessonOccurrenceStatus.NEEDS_COVERAGE) {
            throw new BusinessRuleViolationException(
                    "Assign lesson coverage before recording attendance");
        }
    }

    private UserAccount getAuthenticatedUser(
            Authentication authentication) {
        return authenticatedUserResolver.requireUserAccount(authentication);
    }

    private LessonAttendanceResponse toResponse(
            LessonAttendanceRecord record) {

        Student student = record.getStudent();
        LessonOccurrence occurrence = record.getLessonOccurrence();

        return new LessonAttendanceResponse(
                record.getId(),
                occurrence.getId(),
                student.getId(),
                student.getFirstName() + " " + student.getLastName(),
                occurrence.getLessonDate(),
                record.getStatus(),
                record.getMarkedBy().getId(),
                record.getMarkedAt(),
                record.getRemarks(),
                record.getVersion());
    }
}
