
package com.school.dolphin.identity.entity;

import com.school.dolphin.staff.entity.StaffMember;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "user_invitation",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_invitation_token_hash",
                        columnNames = "token_hash"
                )
        },
        indexes = {
                @Index(
                        name = "idx_user_invitation_expiry",
                        columnList = "expires_at"
                ),
                @Index(
                        name = "idx_user_invitation_creator",
                        columnList = "created_by_user_id"
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserInvitation {

    @Id
    private UUID id;

    @Column(name = "invitation_email", nullable = false, length = 255)
    private String invitationEmail;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 30)
    private OrganizationScopeType scopeType;

    @Column(name = "scope_id", nullable = false)
    private UUID scopeId;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "accepted_at")
    private OffsetDateTime acceptedAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_member_id")
    private StaffMember staffMember;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public static UserInvitation create(
            String invitationEmail,
            String username,
            String firstName,
            String lastName,
            String tokenHash,
            Role role,
            OrganizationScopeType scopeType,
            UUID scopeId,
            OffsetDateTime expiresAt,
            UserAccount createdBy
    ) {
        UserInvitation invitation = new UserInvitation();

        invitation.id = UUID.randomUUID();
        invitation.invitationEmail = invitationEmail;
        invitation.username = username;
        invitation.firstName = firstName;
        invitation.lastName = lastName;
        invitation.tokenHash = tokenHash;
        invitation.role = role;
        invitation.scopeType = scopeType;
        invitation.scopeId = scopeId;
        invitation.expiresAt = expiresAt;
        invitation.createdBy = createdBy;
        invitation.createdAt = OffsetDateTime.now();

        return invitation;
    }

    public boolean isPendingAt(OffsetDateTime now) {
        return acceptedAt == null
                && revokedAt == null
                && expiresAt.isAfter(now);
    }

    public void markAccepted(OffsetDateTime now) {
        if (!isPendingAt(now)) {
            throw new IllegalStateException(
                    "Only a pending invitation can be accepted"
            );
        }

        acceptedAt = now;
    }

    public void revoke(OffsetDateTime now) {
        if (acceptedAt == null && revokedAt == null) {
            revokedAt = now;
        }
    }

    public void linkStaffMember(StaffMember staffMember) {
        this.staffMember = staffMember;
    }
}
