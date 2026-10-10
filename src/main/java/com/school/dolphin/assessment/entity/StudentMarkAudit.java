
package com.school.dolphin.assessment.entity;

import com.school.dolphin.identity.entity.UserAccount;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "student_mark_audit",
        indexes = @Index(
                name = "idx_student_mark_audit_history",
                columnList = "student_mark_id, changed_at"
        )
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMarkAudit {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_mark_id", nullable = false)
    private StudentMark studentMark;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "previous_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal previousMarks;

    @Column(name = "new_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal newMarks;

    @Column(name = "previous_remarks", length = 500)
    private String previousRemarks;

    @Column(name = "new_remarks", length = 500)
    private String newRemarks;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private UserAccount changedBy;

    @Column(name = "changed_at", nullable = false)
    private OffsetDateTime changedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (changedAt == null) {
            changedAt = OffsetDateTime.now();
        }
    }
}