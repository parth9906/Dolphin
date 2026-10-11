package com.school.dolphin.timetable.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.staff.entity.StaffAssignment;

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
@Table(name = "lesson_substitute_audit")
@Getter
@NoArgsConstructor
public class LessonSubstituteAudit {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "occurrence_id", nullable = false)
    private LessonOccurrence occurrence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_substitute_assignment_id")
    private StaffAssignment previousSubstitute;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "new_substitute_assignment_id", nullable = false)
    private StaffAssignment newSubstitute;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private UserAccount changedBy;

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime changedAt;

    public LessonSubstituteAudit(
            LessonOccurrence occurrence,
            StaffAssignment previousSubstitute,
            StaffAssignment newSubstitute,
            UserAccount changedBy,
            String comment) {
        this.occurrence = occurrence;
        this.previousSubstitute = previousSubstitute;
        this.newSubstitute = newSubstitute;
        this.changedBy = changedBy;
        this.comment = comment;
    }

    @PrePersist
    void onCreate() {
        changedAt = OffsetDateTime.now();
    }
}