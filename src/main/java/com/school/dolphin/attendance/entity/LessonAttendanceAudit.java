package com.school.dolphin.attendance.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.identity.entity.UserAccount;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lesson_attendance_audit")
@Getter
@NoArgsConstructor
public class LessonAttendanceAudit {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_attendance_record_id", nullable = false)
    private LessonAttendanceRecord attendanceRecord;

    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @Column(name = "previous_remarks", length = 500)
    private String previousRemarks;

    @Column(name = "new_remarks", length = 500)
    private String newRemarks;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private UserAccount changedBy;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private OffsetDateTime changedAt;

    public LessonAttendanceAudit(
            LessonAttendanceRecord attendanceRecord,
            LessonAttendanceStatus previousStatus,
            LessonAttendanceStatus newStatus,
            String previousRemarks,
            String newRemarks,
            UserAccount changedBy) {

        this.attendanceRecord = attendanceRecord;
        this.previousStatus = previousStatus == null
                ? null : previousStatus.name();
        this.newStatus = newStatus.name();
        this.previousRemarks = previousRemarks;
        this.newRemarks = newRemarks;
        this.changedBy = changedBy;
    }

    @PrePersist
    void onCreate() {
        changedAt = OffsetDateTime.now();
    }
}