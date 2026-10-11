
package com.school.dolphin.notification.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationOutboxClaimService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public List<UUID> claimBatch(int batchSize) {
        if (batchSize < 1 || batchSize > 500) {
            throw new IllegalArgumentException(
                    "Batch size must be between 1 and 500"
            );
        }

        // Recover claims abandoned by a crashed worker.
        entityManager.createNativeQuery("""
                UPDATE notification_outbox
                SET status = 'PENDING',
                    locked_at = NULL,
                    next_attempt_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    last_error = 'Recovered expired processing lease'
                WHERE status = 'PROCESSING'
                  AND locked_at < CURRENT_TIMESTAMP - INTERVAL '10 minutes'
                """).executeUpdate();

        @SuppressWarnings("unchecked")
        List<Object> ids = entityManager.createNativeQuery("""
                WITH candidates AS (
                    SELECT id
                    FROM notification_outbox
                    WHERE status = 'PENDING'
                      AND next_attempt_at <= CURRENT_TIMESTAMP
                    ORDER BY created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT :batchSize
                )
                UPDATE notification_outbox o
                SET status = 'PROCESSING',
                    attempts = attempts + 1,
                    locked_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP,
                    last_error = NULL
                FROM candidates c
                WHERE o.id = c.id
                RETURNING o.id
                """)
                .setParameter("batchSize", batchSize)
                .getResultList();

        return ids.stream()
                .map(id -> id instanceof UUID uuid
                        ? uuid
                        : UUID.fromString(id.toString()))
                .toList();
    }
}
