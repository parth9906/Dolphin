
package com.school.dolphin.guardian.entity;

import com.school.dolphin.identity.entity.UserAccount;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "guardian_invitation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardianInvitation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "invitation_email", nullable = false, length = 255)
    private String invitationEmail;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "accepted_at")
    private OffsetDateTime acceptedAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public boolean isPendingAt(OffsetDateTime now) {
        return acceptedAt == null
                && revokedAt == null
                && expiresAt.isAfter(now);
    }
}