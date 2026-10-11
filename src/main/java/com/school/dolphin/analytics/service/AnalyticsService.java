package com.school.dolphin.analytics.service;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.repository.StudentEnrollmentRepository;
import com.school.dolphin.analytics.dto.AnalyticsInstitutionSummaryResponse;
import com.school.dolphin.attendance.entity.AttendanceStatus;
import com.school.dolphin.attendance.repository.AttendanceRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;
import com.school.dolphin.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final long MAX_RANGE_DAYS = 366;

    private final InstitutionRepository institutionRepository;
    private final StudentRepository studentRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional(readOnly = true)
    public AnalyticsInstitutionSummaryResponse getInstitutionSummary(
            UUID institutionId,
            LocalDate fromDate,
            LocalDate toDate,
            Authentication authentication
    ) {
        if (!institutionRepository.existsById(institutionId)) {
            throw new ResourceNotFoundException(
                    "Institution not found");
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        validateRange(fromDate, toDate);

        long activeStudents =
                studentRepository.countByInstitution_IdAndActiveTrue(
                        institutionId);

        long activeStaff = staffAssignmentRepository
                .countDistinctByInstitution_IdAndStatus(
                        institutionId, StaffAssignmentStatus.ACTIVE);

        long activeEnrollments = studentEnrollmentRepository
                .countBySection_SchoolClass_AcademicYear_Institution_IdAndStatus(
                        institutionId, EnrollmentStatus.ACTIVE);

        Map<AttendanceStatus, Long> counts =
                new EnumMap<>(AttendanceStatus.class);

        for (Object[] row : attendanceRepository
                .countStatusesForInstitutionAndRange(
                        institutionId, fromDate, toDate)) {
            counts.put((AttendanceStatus) row[0], (Long) row[1]);
        }

        long present = counts.getOrDefault(AttendanceStatus.PRESENT, 0L);
        long absent = counts.getOrDefault(AttendanceStatus.ABSENT, 0L);
        long late = counts.getOrDefault(AttendanceStatus.LATE, 0L);
        long excused = counts.getOrDefault(AttendanceStatus.EXCUSED, 0L);
        long eligible = present + absent + late;

        BigDecimal percentage = eligible == 0
                ? BigDecimal.ZERO.setScale(2)
                : BigDecimal.valueOf(present + late)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                BigDecimal.valueOf(eligible),
                                2,
                                RoundingMode.HALF_UP);

        return new AnalyticsInstitutionSummaryResponse(
                institutionId,
                fromDate,
                toDate,
                activeStudents,
                activeStaff,
                activeEnrollments,
                present,
                absent,
                late,
                excused,
                eligible,
                percentage);
    }

    private void validateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null || toDate.isBefore(fromDate)) {
            throw new BusinessRuleViolationException(
                    "A valid reporting date range is required");
        }

        if (ChronoUnit.DAYS.between(fromDate, toDate) + 1 > MAX_RANGE_DAYS) {
            throw new BusinessRuleViolationException(
                    "Analytics supports a maximum range of 366 days");
        }
    }
}
