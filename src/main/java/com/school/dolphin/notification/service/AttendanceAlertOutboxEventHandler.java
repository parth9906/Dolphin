package com.school.dolphin.notification.service;

import com.school.dolphin.notification.entity.NotificationOutbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttendanceAlertOutboxEventHandler implements OutboxEventHandler {

    static final String EVENT_TYPE = "ATTENDANCE_ALERT_CREATED";
    static final String AGGREGATE_TYPE = "ATTENDANCE_ALERT";

    private final AttendanceAlertNotificationSender attendanceAlertNotificationSender;

    @Override
    public String eventType() {
        return EVENT_TYPE;
    }

    @Override
    public void handle(NotificationOutbox event) {
        if (!AGGREGATE_TYPE.equals(event.getAggregateType())) {
            throw new IllegalStateException(
                    "Unexpected aggregate type: " + event.getAggregateType()
            );
        }

        attendanceAlertNotificationSender.sendAttendanceAlert(
                event.getAggregateId()
        );
    }
}
