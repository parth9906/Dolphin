package com.school.dolphin.notification.service;

import com.school.dolphin.notification.entity.NotificationOutbox;
import com.school.dolphin.notification.repository.NotificationOutboxRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class NotificationOutboxDispatchService {

    private static final int MAX_ERROR_LENGTH = 1000;

    private final NotificationOutboxRepository outboxRepository;
    private final NotificationOutboxStateService notificationOutboxStateService;
    private final Map<String, OutboxEventHandler> handlers;

    public NotificationOutboxDispatchService(
            NotificationOutboxRepository outboxRepository,
            NotificationOutboxStateService notificationOutboxStateService,
            List<OutboxEventHandler> outboxEventHandlers
    ) {
        this.outboxRepository = outboxRepository;
        this.notificationOutboxStateService = notificationOutboxStateService;
        this.handlers = buildHandlerRegistry(outboxEventHandlers);
    }

    public void dispatch(UUID eventId) {
        NotificationOutbox event = outboxRepository.findById(eventId)
                .orElseThrow(() -> new IllegalStateException(
                        "Outbox event not found: " + eventId
                ));

        if (!"PROCESSING".equals(event.getStatus())) {
            return;
        }

        OutboxEventHandler handler = handlers.get(event.getEventType());

        if (handler == null) {
            handleMissingHandler(event);
            return;
        }

        try {
            handler.handle(event);
            notificationOutboxStateService.markDelivered(eventId);
        } catch (Exception exception) {
            notificationOutboxStateService.scheduleRetry(eventId, exception);
        }
    }

    private void handleMissingHandler(NotificationOutbox event) {
        String error = "No outbox handler registered for event type "
                + event.getEventType()
                + " (event id " + event.getId()
                + ", aggregate " + event.getAggregateType()
                + ":" + event.getAggregateId() + ")";

        if (error.length() > MAX_ERROR_LENGTH) {
            error = error.substring(0, MAX_ERROR_LENGTH);
        }

        log.error(
                "No outbox handler registered for event type {}; marking event {} "
                        + "(aggregate {}:{}) as DEAD without consuming retries",
                event.getEventType(),
                event.getId(),
                event.getAggregateType(),
                event.getAggregateId()
        );

        notificationOutboxStateService.markDead(event.getId(), error);
    }

    private static Map<String, OutboxEventHandler> buildHandlerRegistry(
            List<OutboxEventHandler> outboxEventHandlers
    ) {
        Map<String, OutboxEventHandler> registry = new HashMap<>();

        for (OutboxEventHandler handler : outboxEventHandlers) {
            String eventType = handler.eventType();

            if (eventType == null || eventType.isBlank()) {
                throw new IllegalStateException(
                        "Outbox handler " + handler.getClass().getName()
                                + " declares a blank event type"
                );
            }

            OutboxEventHandler existing = registry.putIfAbsent(eventType, handler);

            if (existing != null) {
                throw new IllegalStateException(
                        "Duplicate outbox handler registration for event type "
                                + eventType + ": "
                                + existing.getClass().getName() + " and "
                                + handler.getClass().getName()
                );
            }
        }

        return Map.copyOf(registry);
    }
}
