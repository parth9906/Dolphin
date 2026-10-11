
package com.school.dolphin.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationOutboxWorker {

    private final NotificationOutboxClaimService claimService;
    private final NotificationOutboxDispatchService dispatchService;

    @Scheduled(fixedDelayString = "${app.notification.outbox.poll-delay-ms:5000}")
    public void processPendingEvents() {
        var eventIds = claimService.claimBatch(50);

        for (UUID eventId : eventIds) {
            try {
                dispatchService.dispatch(eventId);
            } catch (Exception exception) {
                // The dispatcher should handle ordinary delivery failures.
                // Unexpected failures are logged so one event doesn't stop
                // processing the remaining events in this batch.
                log.error(
                        "Unexpected error processing notification outbox event {}",
                        eventId,
                        exception
                );
            }
        }
    }
}
