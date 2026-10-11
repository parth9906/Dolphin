package com.school.dolphin.attendance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

import com.school.dolphin.attendance.entity.AttendanceAlert;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.notification.entity.NotificationOutbox;
import com.school.dolphin.notification.repository.NotificationOutboxRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.dolphin.attendance.repository.AttendanceAlertRepository;
import com.school.dolphin.attendance.repository.LessonAttendanceRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttendanceAlertService {

    private final AttendanceAlertRepository attendanceAlertRepository;
    private final LessonAttendanceRepository attendanceRepository;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;
    private final NotificationOutboxRepository notificationOutboxRepository;

    @Transactional
    public int generateAlerts(
            UUID institutionId,
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal thresholdPercent,
            Authentication authentication) {

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        validateRange(startDate, endDate);

        if (thresholdPercent == null
                || thresholdPercent.compareTo(BigDecimal.ZERO) < 0
                || thresholdPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessRuleViolationException(
                    "Threshold must be between 0 and 100");
        }

        var aggregates = attendanceRepository.findStudentAttendanceAnalytics(
                institutionId, sectionId, startDate, endDate);

        int created = 0;

        for (var aggregate : aggregates) {
            long eligible = aggregate.eligibleLessons();

            if (eligible <= 0) {
                continue;
            }

            BigDecimal percentage = BigDecimal.valueOf(
                            aggregate.attendedLessons())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(eligible), 2, RoundingMode.HALF_UP);

            if (percentage.compareTo(thresholdPercent) >= 0) {
                continue;
            }

            if (percentage.compareTo(thresholdPercent) >= 0) {
                continue;
            }

            int inserted = attendanceAlertRepository.insertIfAbsent(
                    aggregate.studentId(),
                    institutionId,
                    startDate,
                    endDate,
                    thresholdPercent,
                    percentage
            );

            if (inserted == 1) {
                AttendanceAlert alert = attendanceAlertRepository
                        .findByStudent_IdAndPeriodStartAndPeriodEndAndThresholdPercent(
                                aggregate.studentId(),
                                startDate,
                                endDate,
                                thresholdPercent
                        )
                        .orElseThrow(() -> new IllegalStateException(
                                "Inserted attendance alert could not be loaded"
                        ));

                notificationOutboxRepository.save(
                        NotificationOutbox.attendanceAlert(alert.getId())
                );

                created++;
            }
        }

        return created;
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "A valid reporting date range is required");
        }

        if (java.time.temporal.ChronoUnit.DAYS.between(
                startDate, endDate) + 1 > 366) {
            throw new BusinessRuleViolationException(
                    "Attendance alert evaluation supports a maximum range of 366 days");
        }
    }
}