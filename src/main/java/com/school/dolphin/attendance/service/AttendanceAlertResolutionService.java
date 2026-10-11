
package com.school.dolphin.attendance.service;

import com.school.dolphin.attendance.dto.AttendanceAlertAdminResponse;
import com.school.dolphin.attendance.dto.AttendanceAlertAuditResponse;
import com.school.dolphin.attendance.entity.AttendanceAlert;
import com.school.dolphin.attendance.entity.AttendanceAlertAudit;
import com.school.dolphin.attendance.repository.AttendanceAlertAuditRepository;
import com.school.dolphin.attendance.repository.AttendanceAlertRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceAlertResolutionService {

    private final AttendanceAlertRepository attendanceAlertRepository;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;
    private final AttendanceAlertAuditRepository auditRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;


    @Transactional
    public void resolve(UUID alertId, Authentication authentication) {
        AttendanceAlert alert = attendanceAlertRepository.findByIdForUpdate(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance alert not found"
                ));

        UUID institutionId = alert.getInstitution().getId();

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        String previousStatus = alert.getStatus();

        if ("RESOLVED".equals(previousStatus)) {
            throw new BusinessRuleViolationException(
                    "Attendance alert is already resolved"
            );
        }

        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        alert.resolve();

        auditRepository.save(AttendanceAlertAudit.create(
                alert,
                previousStatus,
                alert.getStatus(),
                user,
                "Resolved by administrator"
        ));

        attendanceAlertRepository.save(alert);
    }

    @Transactional(readOnly = true)
    public List<AttendanceAlertAuditResponse> getAuditHistory(
            UUID alertId,
            Authentication authentication
    ) {
        AttendanceAlert alert = attendanceAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance alert not found"
                ));

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, alert.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        return auditRepository
                .findByAttendanceAlert_IdOrderByChangedAtDesc(alertId)
                .stream()
                .map(audit -> new AttendanceAlertAuditResponse(
                        audit.getId(),
                        audit.getPreviousStatus(),
                        audit.getNewStatus(),
                        audit.getChangedBy().getId(),
                        audit.getChangedBy().getUsername(),
                        audit.getComment(),
                        audit.getChangedAt()
                ))
                .toList();
    }


    @Transactional
    public void acknowledge(UUID alertId, Authentication authentication) {
        AttendanceAlert alert = attendanceAlertRepository.findByIdForUpdate(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance alert not found"
                ));

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, alert.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        String previousStatus = alert.getStatus();

        if (!"OPEN".equals(previousStatus)) {
            throw new BusinessRuleViolationException(
                    "Only OPEN attendance alerts can be acknowledged"
            );
        }

        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        // Uses the existing status-transition method on AttendanceAlert.
        alert.acknowledge();

        auditRepository.save(AttendanceAlertAudit.create(
                alert,
                previousStatus,
                alert.getStatus(),
                user,
                "Acknowledged by administrator"
        ));

        attendanceAlertRepository.save(alert);
    }


    @Transactional(readOnly = true)
    public Page<AttendanceAlertAdminResponse> searchAlerts(
            UUID institutionId,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            Authentication authentication
    ) {
        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)
                || ChronoUnit.DAYS.between(startDate, endDate) + 1 > 366) {
            throw new BusinessRuleViolationException(
                    "Provide a valid reporting period of at most 366 days"
            );
        }

        if (page < 0 || size < 1 || size > 100) {
            throw new BusinessRuleViolationException(
                    "Page must be non-negative and size must be between 1 and 100"
            );
        }

        if (status != null && !List.of(
                "OPEN", "ACKNOWLEDGED", "RESOLVED"
        ).contains(status)) {
            throw new BusinessRuleViolationException(
                    "Status must be OPEN, ACKNOWLEDGED, or RESOLVED"
            );
        }

        return attendanceAlertRepository.searchAlerts(
                        institutionId,
                        status,
                        startDate,
                        endDate,
                        PageRequest.of(page, size)
                )
                .map(alert -> new AttendanceAlertAdminResponse(
                        alert.getId(),
                        alert.getStudent().getId(),
                        alert.getInstitution().getId(),
                        alert.getPeriodStart(),
                        alert.getPeriodEnd(),
                        alert.getThresholdPercent(),
                        alert.getAttendancePercent(),
                        alert.getStatus(),
                        alert.getGeneratedAt(),
                        alert.getAcknowledgedAt()
                ));
    }


}
