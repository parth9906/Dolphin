
package com.school.dolphin.notification.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.notification.dto.NotificationOutboxFailureResponse;
import com.school.dolphin.notification.dto.NotificationOutboxSummaryResponse;
import com.school.dolphin.notification.repository.NotificationOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationOutboxAdminService {

    private final NotificationOutboxRepository outboxRepository;

    @Transactional(readOnly = true)
    public Page<NotificationOutboxFailureResponse> getDeadEvents(
            int page,
            int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BusinessRuleViolationException(
                    "Page must be non-negative and size must be between 1 and 100"
            );
        }

        return outboxRepository
                .findByStatusOrderByCreatedAtAsc(
                        "DEAD",
                        PageRequest.of(page, size)
                )
                .map(event -> new NotificationOutboxFailureResponse(
                        event.getId(),
                        event.getEventType(),
                        event.getAggregateType(),
                        event.getAggregateId(),
                        event.getStatus(),
                        event.getAttempts(),
                        event.getCreatedAt(),
                        event.getUpdatedAt(),
                        event.getLastError()
                ));
    }

    @Transactional
    public void retryDeadEvent(UUID eventId) {
        if (!outboxRepository.existsById(eventId)) {
            throw new ResourceNotFoundException(
                    "Notification outbox event not found"
            );
        }

        int updated = outboxRepository.requeueDeadEvent(eventId);

        if (updated != 1) {
            throw new BusinessRuleViolationException(
                    "Only DEAD notification events can be manually retried"
            );
        }
    }

    @Transactional(readOnly = true)
    public NotificationOutboxSummaryResponse getSummary() {
        long pending = outboxRepository.countByStatus("PENDING");
        long processing = outboxRepository.countByStatus("PROCESSING");
        long delivered = outboxRepository.countByStatus("DELIVERED");
        long dead = outboxRepository.countByStatus("DEAD");

        return new NotificationOutboxSummaryResponse(
                pending,
                processing,
                delivered,
                dead,
                pending + processing + delivered + dead
        );
    }
}
