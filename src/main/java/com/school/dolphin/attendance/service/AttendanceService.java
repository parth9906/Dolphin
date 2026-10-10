
package com.school.dolphin.attendance.service;

import com.school.dolphin.attendance.dto.*;
import com.school.dolphin.attendance.entity.AttendanceAudit;
import com.school.dolphin.attendance.entity.AttendanceAuditAction;
import com.school.dolphin.attendance.entity.AttendanceRecord;
import com.school.dolphin.attendance.entity.AttendanceStatus;
import com.school.dolphin.attendance.repository.AttendanceAuditRepository;
import com.school.dolphin.attendance.repository.AttendanceRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AttendanceAuditRepository attendanceAuditRepository;
    private final CampusRepository campusRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            InstitutionRepository institutionRepository,
            UserAccountRepository userAccountRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            AttendanceAuditRepository attendanceAuditRepository,
            CampusRepository campusRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.institutionRepository = institutionRepository;
        this.userAccountRepository = userAccountRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.attendanceAuditRepository = attendanceAuditRepository;
        this.campusRepository = campusRepository;
    }

    @Transactional
    public List<AttendanceResponse> markAttendance(
            MarkAttendanceRequest request,
            Authentication authentication) {

        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot mark attendance for an inactive institution.");
        }

        requireInstitutionAccess(authentication, institution.getId());

        LocalDate attendanceDate = request.attendanceDate();

        if (attendanceDate.isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "Attendance cannot be marked for a future date.");
        }

        List<MarkAttendanceRequest.StudentAttendanceEntry> entries =
                request.records();

        Set<UUID> studentIds = new HashSet<>();

        for (var entry : entries) {
            if (!studentIds.add(entry.studentId())) {
                throw new BusinessRuleViolationException(
                        "A student appears more than once in the request.");
            }
        }

        List<Student> students =
                studentRepository.findByIdInAndInstitution_IdAndActiveTrue(
                        studentIds, institution.getId());

        if (students.size() != studentIds.size()) {
            throw new BusinessRuleViolationException(
                    "Every student must be active and belong to the selected institution.");
        }

        for (UUID studentId : studentIds) {
            if (attendanceRepository.existsByStudent_IdAndAttendanceDate(
                    studentId, attendanceDate)) {
                throw new DuplicateResourceException(
                        "Attendance already exists for student "
                                + studentId + " on " + attendanceDate);
            }
        }

        UUID userId = getAuthenticatedUserId(authentication);
        UserAccount markedBy = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User account not found"));

        var entriesByStudentId = entries.stream().collect(
                java.util.stream.Collectors.toMap(
                        MarkAttendanceRequest.StudentAttendanceEntry::studentId,
                        entry -> entry
                ));

        List<AttendanceRecord> records = students.stream()
                .map(student -> {
                    var entry = entriesByStudentId.get(student.getId());

                    return AttendanceRecord.builder()
                            .student(student)
                            .attendanceDate(attendanceDate)
                            .status(entry.status())
                            .remarks(normalizeRemarks(entry.remarks()))
                            .markedBy(markedBy)
                            .build();
                })
                .toList();


        List<AttendanceRecord> savedRecords =
                        attendanceRepository.saveAll(records);

        List<AttendanceAudit> auditEntries = savedRecords.stream()
                .map(record -> AttendanceAudit.builder()
                        .attendanceRecord(record)
                        .action(AttendanceAuditAction.CREATED)
                        .previousStatus(null)
                        .newStatus(record.getStatus())
                        .previousRemarks(null)
                        .newRemarks(record.getRemarks())
                        .changedBy(markedBy)
                        .build())
                .toList();

        attendanceAuditRepository.saveAll(auditEntries);

        return savedRecords.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AttendanceResponse updateAttendance(
            UUID attendanceId,
            UpdateAttendanceRequest request,
            Authentication authentication) {

        AttendanceRecord record = attendanceRepository.findById(attendanceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Attendance record not found"));

        UUID institutionId = record.getStudent().getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!record.getStudent().isActive()) {
            throw new BusinessRuleViolationException(
                    "Attendance for an inactive student cannot be changed.");
        }

        if (record.getAttendanceDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "Attendance for a future date cannot be changed.");
        }

        AttendanceStatus previousStatus = record.getStatus();
        String previousRemarks = record.getRemarks();

        UUID userId = getAuthenticatedUserId(authentication);
        UserAccount changedBy = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User account not found"));

        record.setStatus(request.status());
        record.setRemarks(normalizeRemarks(request.remarks()));

        AttendanceRecord savedRecord = attendanceRepository.save(record);

        AttendanceAudit audit = AttendanceAudit.builder()
                .attendanceRecord(savedRecord)
                .action(AttendanceAuditAction.UPDATED)
                .previousStatus(previousStatus)
                .newStatus(savedRecord.getStatus())
                .previousRemarks(previousRemarks)
                .newRemarks(savedRecord.getRemarks())
                .changedBy(changedBy)
                .build();

        attendanceAuditRepository.save(audit);

        return toResponse(savedRecord);
    }


    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AttendanceResponse>
    getInstitutionAttendance(
            UUID institutionId,
            LocalDate attendanceDate,
            UUID studentId,
            org.springframework.data.domain.Pageable pageable,
            Authentication authentication) {

        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Institution is inactive.");
        }

        requireInstitutionAccess(authentication, institutionId);

        if (attendanceDate == null || attendanceDate.isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "A valid attendance date is required.");
        }

        if (studentId != null) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Student not found"));

            if (!student.isActive()
                    || !student.getInstitution().getId().equals(institutionId)) {
                throw new ResourceNotFoundException("Student not found");
            }
        }

        int pageSize = Math.min(Math.max(pageable.getPageSize(), 1), 100);

        var safePageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                pageSize,
                pageable.getSort()
        );

        return attendanceRepository.findInstitutionAttendance(
                        institutionId, attendanceDate, studentId, safePageable)
                .map(this::toResponse);
    }



    @Transactional(readOnly = true)
    public List<AttendanceAuditResponse> getAttendanceAudit(
            UUID attendanceId,
            Authentication authentication) {

        AttendanceRecord record = attendanceRepository.findById(attendanceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Attendance record not found"));

        requireInstitutionAccess(
                authentication,
                record.getStudent().getInstitution().getId()
        );

        return attendanceAuditRepository
                .findByAttendanceRecord_IdOrderByChangedAtDesc(attendanceId)
                .stream()
                .map(audit -> new AttendanceAuditResponse(
                        audit.getId(),
                        audit.getAttendanceRecord().getId(),
                        audit.getAction(),
                        audit.getPreviousStatus(),
                        audit.getNewStatus(),
                        audit.getPreviousRemarks(),
                        audit.getNewRemarks(),
                        audit.getChangedBy().getId(),
                        audit.getChangedAt()
                ))
                .toList();
    }


    @Transactional(readOnly = true)
    public AttendanceSummaryResponse getDailySummary(
            UUID institutionId,
            UUID campusId,
            LocalDate attendanceDate,
            Authentication authentication) {

        validateSummaryScope(institutionId, campusId, authentication);

        if (attendanceDate == null || attendanceDate.isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "A valid attendance date is required.");
        }

        Map<AttendanceStatus, Long> counts = emptyStatusCounts();

        for (Object[] row : attendanceRepository.countStatusesForDate(
                institutionId, campusId, attendanceDate)) {
            counts.put((AttendanceStatus) row[0], (Long) row[1]);
        }

        return toSummary(institutionId, campusId, attendanceDate, counts);
    }

    @Transactional(readOnly = true)
    public List<DailyAttendanceTrendResponse> getAttendanceTrend(
            UUID institutionId,
            UUID campusId,
            LocalDate from,
            LocalDate to,
            Authentication authentication) {

        validateSummaryScope(institutionId, campusId, authentication);

        if (from == null || to == null || to.isBefore(from)
                || to.isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "A valid attendance date range is required.");
        }

        if (java.time.temporal.ChronoUnit.DAYS.between(from, to) > 90) {
            throw new BusinessRuleViolationException(
                    "The attendance trend range cannot exceed 90 days.");
        }

        // Include dates with no attendance records so the chart has no gaps.
        Map<LocalDate, Map<AttendanceStatus, Long>> dailyCounts = new TreeMap<>();

        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            dailyCounts.put(date, emptyStatusCounts());
        }

        for (Object[] row : attendanceRepository.countStatusesByDateRange(
                institutionId, campusId, from, to)) {
            LocalDate date = (LocalDate) row[0];
            AttendanceStatus status = (AttendanceStatus) row[1];
            Long count = (Long) row[2];

            dailyCounts.get(date).put(status, count);
        }

        return dailyCounts.entrySet().stream()
                .map(entry -> {
                    Map<AttendanceStatus, Long> counts = entry.getValue();
                    long present = counts.get(AttendanceStatus.PRESENT);
                    long absent = counts.get(AttendanceStatus.ABSENT);
                    long late = counts.get(AttendanceStatus.LATE);
                    long excused = counts.get(AttendanceStatus.EXCUSED);
                    long eligible = present + absent + late;

                    return new DailyAttendanceTrendResponse(
                            entry.getKey(),
                            present,
                            absent,
                            late,
                            excused,
                            eligible + excused,
                            eligible,
                            calculatePercentage(present + late, eligible)
                    );
                })
                .toList();
    }

    private Map<AttendanceStatus, Long> emptyStatusCounts() {
        Map<AttendanceStatus, Long> counts =
                new EnumMap<>(AttendanceStatus.class);

        for (AttendanceStatus status : AttendanceStatus.values()) {
            counts.put(status, 0L);
        }

        return counts;
    }

    private AttendanceSummaryResponse toSummary(
            UUID institutionId,
            UUID campusId,
            LocalDate date,
            Map<AttendanceStatus, Long> counts) {

        long present = counts.get(AttendanceStatus.PRESENT);
        long absent = counts.get(AttendanceStatus.ABSENT);
        long late = counts.get(AttendanceStatus.LATE);
        long excused = counts.get(AttendanceStatus.EXCUSED);
        long eligible = present + absent + late;

        return new AttendanceSummaryResponse(
                institutionId,
                campusId,
                date,
                present,
                absent,
                late,
                excused,
                eligible + excused,
                eligible,
                calculatePercentage(present + late, eligible)
        );
    }

    private double calculatePercentage(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }

        return Math.round((numerator * 10000.0) / denominator) / 100.0;
    }

    private void validateSummaryScope(
            UUID institutionId,
            UUID campusId,
            Authentication authentication) {

        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Institution is inactive.");
        }

        if (campusId == null) {
            requireInstitutionAccess(authentication, institutionId);
            return;
        }

        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Campus not found"));

        if (!campus.isActive()
                || !campus.getInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("Campus not found");
        }

        if (!scopeAuthorization.canAccessCampus(authentication, campusId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have access to this campus.");
        }
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId) {

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    private UUID getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new AccessDeniedException("Authenticated user is required.");
        }

        return user.userId();
    }

    private String normalizeRemarks(String remarks) {
        if (remarks == null || remarks.isBlank()) {
            return null;
        }

        return remarks.trim();
    }

    private AttendanceResponse toResponse(AttendanceRecord record) {
        return new AttendanceResponse(
                record.getId(),
                record.getStudent().getId(),
                record.getStudent().getInstitution().getId(),
                record.getAttendanceDate(),
                record.getStatus(),
                record.getRemarks()
        );
    }
}