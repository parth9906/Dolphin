
package com.school.dolphin.attendance.entity;

import com.school.dolphin.identity.entity.UserAccount;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "attendance_audit",
        indexes = @Index(
                name = "idx_attendance_audit_record_changed",
                columnList = "attendance_record_id, changed_at"
        )
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceAudit {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_record_id", nullable = false)
    private AttendanceRecord attendanceRecord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceAuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 20)
    private AttendanceStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private AttendanceStatus newStatus;

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