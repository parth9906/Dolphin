package com.school.dolphin.identity.entity;

import com.school.dolphin.identity.entity.OrganizationScopeType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "user_organization_scope",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_org_scope",
                        columnNames = {"user_id", "scope_type", "scope_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOrganizationScope {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_org_scope_user")
    )
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 30)
    private OrganizationScopeType scopeType;

    @Column(name = "scope_id", nullable = false)
    private UUID scopeId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        createdAt = OffsetDateTime.now();
    }
}