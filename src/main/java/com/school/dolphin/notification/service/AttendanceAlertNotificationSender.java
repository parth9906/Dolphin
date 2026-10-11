package com.school.dolphin.notification.service;

import java.util.UUID;

public interface AttendanceAlertNotificationSender {

    void sendAttendanceAlert(UUID attendanceAlertId);
}