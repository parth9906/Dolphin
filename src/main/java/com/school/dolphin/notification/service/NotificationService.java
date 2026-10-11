
package com.school.dolphin.notification.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.notification.dto.NotificationResponse;
import com.school.dolphin.notification.entity.Notification;
import com.school.dolphin.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public boolean createIfAbsent(
            UUID recipientUserId,
            String notificationType,
            String title,
            String message,
            String referenceType,
            UUID referenceId,
            String idempotencyKey
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()
                || idempotencyKey.length() > 200) {
            throw new IllegalArgumentException(
                    "A valid idempotency key is required"
            );
        }

        return notificationRepository.insertIfAbsent(
                recipientUserId,
                notificationType,
                title,
                message,
                referenceType,
                referenceId,
                idempotencyKey
        ) == 1;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getInbox(
            Authentication authentication,
            int page,
            int size
    ) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page must be non-negative and size must be between 1 and 100"
            );
        }

        UserAccount user = getAuthenticatedUser(authentication);

        return notificationRepository
                .findByRecipientUser_IdOrderByCreatedAtDesc(
                        user.getId(),
                        PageRequest.of(page, size)
                )
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Authentication authentication) {
        UserAccount user = getAuthenticatedUser(authentication);

        return notificationRepository
                .countByRecipientUser_IdAndReadAtIsNull(user.getId());
    }

    @Transactional
    public void markRead(
            UUID notificationId,
            Authentication authentication
    ) {
        UserAccount user = getAuthenticatedUser(authentication);

        int updated = notificationRepository.markReadIfUnread(
                notificationId,
                user.getId()
        );

        if (updated == 1) {
            return;
        }

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found"
                ));

        if (!notification.getRecipientUser().getId().equals(user.getId())) {
            // Avoid revealing whether another user's notification exists.
            throw new ResourceNotFoundException("Notification not found");
        }

        // Already read by this recipient: treat the request as idempotent.
    }

    @Transactional
    public int markAllRead(Authentication authentication) {
        UserAccount user = getAuthenticatedUser(authentication);

        return notificationRepository.markAllReadForUser(user.getId());
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getInbox(
            Authentication authentication,
            int page,
            int size,
            boolean unreadOnly,
            String notificationType
    ) {
        if (page < 0) {
            throw new BusinessRuleViolationException(
                    "Page must be greater than or equal to zero"
            );
        }

        if (size < 1 || size > 100) {
            throw new BusinessRuleViolationException(
                    "Page size must be between 1 and 100"
            );
        }

        String normalizedType = notificationType == null
                ? null
                : notificationType.trim().toUpperCase(Locale.ROOT);

        if (normalizedType != null && normalizedType.isBlank()) {
            normalizedType = null;
        }

        if (normalizedType != null && normalizedType.length() > 50) {
            throw new BusinessRuleViolationException(
                    "Notification type cannot exceed 50 characters"
            );
        }

        UserAccount user = getAuthenticatedUser(authentication);

        return notificationRepository.searchInbox(
                        user.getId(),
                        unreadOnly,
                        normalizedType,
                        PageRequest.of(page, size)
                )
                .map(this::toResponse);
    }

    private UserAccount getAuthenticatedUser(
            Authentication authentication
    ) {
        return authenticatedUserResolver.requireUserAccount(authentication);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getNotificationType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.getCreatedAt(),
                notification.getReadAt(),
                notification.isRead()
        );
    }
}
