package com.school.dolphin.inventory.entity;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
// Uniqueness of (institution_id, code) is case-insensitive and enforced by a
// functional unique index in the database (see V73 migration).
@Table(name = "inventory_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id")
    private Campus campus;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InventoryItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InventoryUnit unit;

    @Column(name = "quantity_on_hand", nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityOnHand;

    @Column(name = "reorder_level", nullable = false, precision = 14, scale = 3)
    private BigDecimal reorderLevel;

    @Column(nullable = false)
    private boolean active;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (createdAt == null) createdAt = now;
        updatedAt = now;

        if (quantityOnHand == null) quantityOnHand = BigDecimal.ZERO;
        if (reorderLevel == null) reorderLevel = BigDecimal.ZERO;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public boolean isLowStock() {
        return reorderLevel != null
                && reorderLevel.signum() > 0
                && quantityOnHand.compareTo(reorderLevel) <= 0;
    }
}
