
package com.school.dolphin.notification.repository;

import com.school.dolphin.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface NotificationRepository
        extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientUser_IdOrderByCreatedAtDesc(
            UUID recipientUserId,
            Pageable pageable
    );

    @Modifying
    @Query(value = """
        INSERT INTO notification (
            id,
            recipient_user_id,
            notification_type,
            title,
            message,
            reference_type,
            reference_id,
            idempotency_key,
            created_at
        )
        VALUES (
            gen_random_uuid(),
            :recipientUserId,
            :notificationType,
            :title,
            :message,
            :referenceType,
            :referenceId,
            :idempotencyKey,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (recipient_user_id, idempotency_key)
        DO NOTHING
        """, nativeQuery = true)
    int insertIfAbsent(
            @Param("recipientUserId") UUID recipientUserId,
            @Param("notificationType") String notificationType,
            @Param("title") String title,
            @Param("message") String message,
            @Param("referenceType") String referenceType,
            @Param("referenceId") UUID referenceId,
            @Param("idempotencyKey") String idempotencyKey
    );

    @Modifying
    @Query("""
        UPDATE Notification n
        SET n.readAt = CURRENT_TIMESTAMP
        WHERE n.id = :notificationId
          AND n.recipientUser.id = :recipientUserId
          AND n.readAt IS NULL
        """)
    int markReadIfUnread(
            @Param("notificationId") UUID notificationId,
            @Param("recipientUserId") UUID recipientUserId
    );

    long countByRecipientUser_IdAndReadAtIsNull(UUID recipientUserId);

    @Modifying
    @Query("""
    UPDATE Notification n
    SET n.readAt = CURRENT_TIMESTAMP
    WHERE n.recipientUser.id = :recipientUserId
      AND n.readAt IS NULL
    """)
    int markAllReadForUser(
            @Param("recipientUserId") UUID recipientUserId
    );

    @Query("""
    SELECT n
    FROM Notification n
    WHERE n.recipientUser.id = :recipientUserId
      AND (:unreadOnly = false OR n.readAt IS NULL)
      AND (
          :notificationType IS NULL
          OR n.notificationType = :notificationType
      )
    ORDER BY n.createdAt DESC
    """)
    Page<Notification> searchInbox(
            @Param("recipientUserId") UUID recipientUserId,
            @Param("unreadOnly") boolean unreadOnly,
            @Param("notificationType") String notificationType,
            Pageable pageable
    );
}
