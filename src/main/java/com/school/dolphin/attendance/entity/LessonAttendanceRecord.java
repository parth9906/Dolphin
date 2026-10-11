package com.school.dolphin.attendance.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.timetable.entity.LessonOccurrence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "lesson_attendance_record",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_lesson_attendance_occurrence_student",
                columnNames = {"lesson_occurrence_id", "student_id"}
        )
)
@Getter
@NoArgsConstructor
public class LessonAttendanceRecord {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_occurrence_id", nullable = false)
    private LessonOccurrence lessonOccurrence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonAttendanceStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marked_by_user_id", nullable = false)
    private UserAccount markedBy;

    @Column(name = "marked_at", nullable = false)
    private OffsetDateTime markedAt;

    @Column(length = 500)
    private String remarks;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public LessonAttendanceRecord(
            LessonOccurrence lessonOccurrence,
            Student student,
            LessonAttendanceStatus status,
            UserAccount markedBy,
            String remarks) {

        this.lessonOccurrence = lessonOccurrence;
        this.student = student;
        this.status = status;
        this.markedBy = markedBy;
        this.remarks = normalizeRemarks(remarks);
        this.markedAt = OffsetDateTime.now();
    }

    public void correct(
            LessonAttendanceStatus newStatus,
            UserAccount changedBy,
            String newRemarks) {

        this.status = newStatus;
        this.markedBy = changedBy;
        this.remarks = normalizeRemarks(newRemarks);
        this.markedAt = OffsetDateTime.now();
    }

    private static String normalizeRemarks(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (markedAt == null) {
            markedAt = now;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}