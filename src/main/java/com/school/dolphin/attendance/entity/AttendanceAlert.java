package com.school.dolphin.attendance.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.student.entity.Student;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "attendance_alert",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_attendance_alert_period",
                columnNames = {
                        "student_id",
                        "period_start",
                        "period_end",
                        "threshold_percent"
                }
        )
)
@Getter
@NoArgsConstructor
public class AttendanceAlert {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "threshold_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal thresholdPercent;

    @Column(name = "attendance_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal attendancePercent;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(name = "generated_at", nullable = false, updatable = false)
    private OffsetDateTime generatedAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    public AttendanceAlert(
            Student student,
            Institution institution,
            LocalDate periodStart,
            LocalDate periodEnd,
            BigDecimal thresholdPercent,
            BigDecimal attendancePercent) {

        this.student = student;
        this.institution = institution;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.thresholdPercent = thresholdPercent;
        this.attendancePercent = attendancePercent;
    }

    public void acknowledge() {
        if (!"OPEN".equals(status)) {
            return;
        }

        status = "ACKNOWLEDGED";
        acknowledgedAt = OffsetDateTime.now();
    }

    public void resolve() {
        status = "RESOLVED";
    }

    @PrePersist
    void onCreate() {
        if (generatedAt == null) {
            generatedAt = OffsetDateTime.now();
        }
    }
}