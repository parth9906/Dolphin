
package com.school.dolphin.attendance.entity;

import com.school.dolphin.identity.entity.UserAccount;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_alert_audit")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AttendanceAlertAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_alert_id", nullable = false)
    private AttendanceAlert attendanceAlert;

    @Column(name = "previous_status", nullable = false, length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private UserAccount changedBy;

    @Column(length = 1000)
    private String comment;

    @Column(name = "changed_at", nullable = false)
    private OffsetDateTime changedAt;

    public static AttendanceAlertAudit create(
            AttendanceAlert alert,
            String previousStatus,
            String newStatus,
            UserAccount changedBy,
            String comment
    ) {
        AttendanceAlertAudit audit = new AttendanceAlertAudit();
        audit.attendanceAlert = alert;
        audit.previousStatus = previousStatus;
        audit.newStatus = newStatus;
        audit.changedBy = changedBy;
        audit.comment = comment;
        audit.changedAt = OffsetDateTime.now();
        return audit;
    }
}
