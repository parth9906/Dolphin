package com.school.dolphin.timetable.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.staff.entity.StaffAssignment;

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
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "timetable_lesson_occurrence",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_lesson_occurrence_date",
                columnNames = {"scheduled_lesson_id", "lesson_date"}
        )
)
@Getter
@NoArgsConstructor
public class LessonOccurrence {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scheduled_lesson_id", nullable = false)
    private ScheduledLesson scheduledLesson;

    @Column(name = "lesson_date", nullable = false)
    private LocalDate lessonDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LessonOccurrenceStatus status = LessonOccurrenceStatus.SCHEDULED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "substitute_staff_assignment_id")
    private StaffAssignment substituteStaffAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id")
    private UserAccount assignedBy;

    @Column(name = "substitute_assigned_at")
    private OffsetDateTime substituteAssignedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public LessonOccurrence(ScheduledLesson scheduledLesson, LocalDate lessonDate) {
        this.scheduledLesson = scheduledLesson;
        this.lessonDate = lessonDate;
    }

    public void markNeedsCoverage() {
        if (status == LessonOccurrenceStatus.SCHEDULED) {
            status = LessonOccurrenceStatus.NEEDS_COVERAGE;
        }
    }

    public void markCompleted() {
        if (status != LessonOccurrenceStatus.SCHEDULED) {
            throw new IllegalStateException(
                    "Only a scheduled lesson can be marked completed");
        }
        status = LessonOccurrenceStatus.COMPLETED;
    }

    public void assignSubstitute(
            StaffAssignment substitute,
            UserAccount assignedBy) {

        if (status != LessonOccurrenceStatus.NEEDS_COVERAGE
                && status != LessonOccurrenceStatus.COVERAGE_ASSIGNED) {
            throw new IllegalStateException(
                    "A substitute can only be assigned to a lesson needing coverage "
                            + "or one that already has coverage assigned");
        }

        this.substituteStaffAssignment = substitute;
        this.assignedBy = assignedBy;
        this.substituteAssignedAt = OffsetDateTime.now();
        this.status = LessonOccurrenceStatus.COVERAGE_ASSIGNED;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

