package com.school.dolphin.notification.service;

import com.school.dolphin.notification.entity.NotificationOutbox;
import com.school.dolphin.notification.repository.NotificationOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationOutboxStateService {

    private static final int MAX_ATTEMPTS = 8;

    private final NotificationOutboxRepository outboxRepository;

    @Transactional
    public void markDelivered(UUID eventId) {
        NotificationOutbox event = outboxRepository.findById(eventId)
                .orElseThrow();

        event.markDelivered(OffsetDateTime.now());
        outboxRepository.save(event);
    }

    @Transactional
    public void scheduleRetry(UUID eventId, Exception exception) {
        NotificationOutbox event = outboxRepository.findById(eventId)
                .orElseThrow();

        boolean permanentlyFailed = event.getAttempts() >= MAX_ATTEMPTS;

        long delaySeconds = Math.min(
                30L * (1L << Math.min(
                        Math.max(event.getAttempts() - 1, 0), 7)),
                3600L
        );

        String error = exception.getClass().getSimpleName()
                + ": " + String.valueOf(exception.getMessage());

        if (error.length() > 1000) {
            error = error.substring(0, 1000);
        }

        event.scheduleRetry(
                OffsetDateTime.now().plusSeconds(delaySeconds),
                error,
                permanentlyFailed
        );

        outboxRepository.save(event);
    }

    @Transactional
    public void markDead(UUID eventId, String error) {
        NotificationOutbox event = outboxRepository.findById(eventId)
                .orElseThrow();

        event.markDead(OffsetDateTime.now(), error);
        outboxRepository.save(event);
    }
}
