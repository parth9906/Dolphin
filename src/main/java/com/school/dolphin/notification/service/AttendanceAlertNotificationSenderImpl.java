
package com.school.dolphin.notification.service;

import com.school.dolphin.attendance.entity.AttendanceAlert;
import com.school.dolphin.attendance.repository.AttendanceAlertRepository;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.guardian.entity.Guardian;
import com.school.dolphin.guardian.entity.StudentGuardian;
import com.school.dolphin.guardian.repository.StudentGuardianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceAlertNotificationSenderImpl
        implements AttendanceAlertNotificationSender {

    private final AttendanceAlertRepository attendanceAlertRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void sendAttendanceAlert(UUID attendanceAlertId) {
        AttendanceAlert alert = attendanceAlertRepository
                .findById(attendanceAlertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance alert not found: " + attendanceAlertId
                ));

        UUID studentId = alert.getStudent().getId();

        List<StudentGuardian> guardianLinks =
                studentGuardianRepository.findActiveGuardiansForStudent(studentId);

        String title = "Attendance alert";

        String message = String.format(
                Locale.ROOT,
                "Attendance for your linked student was %.2f%% from %s to %s, " +
                        "below the configured threshold of %.2f%%.",
                alert.getAttendancePercent(),
                alert.getPeriodStart(),
                alert.getPeriodEnd(),
                alert.getThresholdPercent()
        );

        for (StudentGuardian link : guardianLinks) {
            Guardian guardian = link.getGuardian();

            if (guardian == null || guardian.getUserAccount() == null) {
                continue;
            }

            UUID recipientUserId = guardian.getUserAccount().getId();

            if (recipientUserId == null) {
                continue;
            }

            notificationService.createIfAbsent(
                    recipientUserId,
                    "ATTENDANCE_ALERT",
                    title,
                    message,
                    "ATTENDANCE_ALERT",
                    alert.getId(),
                    "attendance-alert:" + alert.getId()
            );
        }
    }
}
