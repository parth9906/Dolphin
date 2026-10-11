
package com.school.dolphin.notification.service;

import com.school.dolphin.notification.entity.NotificationOutbox;
import com.school.dolphin.notification.repository.NotificationOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationOutboxDispatchService {

    private static final int MAX_ATTEMPTS = 8;

    private final NotificationOutboxRepository outboxRepository;
    private final AttendanceAlertNotificationSender attendanceAlertNotificationSender;
    private final NotificationOutboxStateService notificationOutboxStateService;

    public void dispatch(UUID eventId) {
        NotificationOutbox event = outboxRepository.findById(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "Outbox event not found: " + eventId
                ));

        if (!"PROCESSING".equals(event.getStatus())) {
            return;
        }

        try {
            switch (event.getEventType()) {
                case "ATTENDANCE_ALERT_CREATED" -> {
                    if (!"ATTENDANCE_ALERT".equals(event.getAggregateType())) {
                        throw new IllegalStateException(
                                "Unexpected aggregate type: " + event.getAggregateType()
                        );
                    }

                    attendanceAlertNotificationSender.sendAttendanceAlert(
                            event.getAggregateId()
                    );
                }
                default -> throw new IllegalStateException(
                        "Unsupported outbox event type: "
                                + event.getEventType()
                );
            }

            notificationOutboxStateService.markDelivered(eventId);
        } catch (Exception exception) {
            notificationOutboxStateService.scheduleRetry(eventId, exception);
        }
    }
}
