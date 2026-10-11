
package com.school.dolphin.notification.repository;

import com.school.dolphin.notification.entity.NotificationOutbox;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;


import java.util.List;
import java.util.UUID;

public interface NotificationOutboxRepository
        extends JpaRepository<NotificationOutbox, UUID> {

    long countByStatus(String status);

    @Query(value = """
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
        """, nativeQuery = true)
    List<UUID> claimPendingBatch(@Param("batchSize") int batchSize);

    Page<NotificationOutbox> findByStatusOrderByCreatedAtAsc(
            String status,
            Pageable pageable
    );

    @Modifying
    @Query(value = """
    UPDATE notification_outbox
    SET status = 'PENDING',
        attempts = 0,
        next_attempt_at = CURRENT_TIMESTAMP,
        locked_at = NULL,
        delivered_at = NULL,
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :eventId
      AND status = 'DEAD'
    """, nativeQuery = true)
    int requeueDeadEvent(@Param("eventId") UUID eventId);
}
