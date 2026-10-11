package com.school.dolphin.mess.entity;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Canteen/mess meal service header. Inventory consumed for the meal is stored
 * as {@code inventory_stock_movement} rows with
 * {@code reference_type = 'MESS_MEAL'} and {@code reference_id = id}, so the
 * inventory ledger remains the single source of truth for stock changes.
 */
@Entity
@Table(name = "mess_meal_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessMealRecord {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id")
    private Campus campus;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MessMealType mealType;

    @Column(name = "served_on", nullable = false)
    private LocalDate servedOn;

    @Column(nullable = false)
    private int headcount;

    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by_user_id", nullable = false)
    private UserAccount recordedBy;

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
}
