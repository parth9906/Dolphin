package com.school.dolphin.homework.entity;

import com.school.dolphin.student.entity.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "assignment_submission",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_assignment_submission_student",
                columnNames = {"assignment_id", "student_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class AssignmentSubmission {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "submission_text", nullable = false, columnDefinition = "TEXT")
    private String submissionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssignmentSubmissionStatus status =
            AssignmentSubmissionStatus.SUBMITTED;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt;

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
        if (submittedAt == null) {
            submittedAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
