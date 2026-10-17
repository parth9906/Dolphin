package com.school.dolphin.academic.entity;

import com.school.dolphin.student.entity.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "student_promotion_batch_item",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_promotion_batch_student",
                        columnNames = {"batch_id", "student_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class StudentPromotionBatchItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private StudentPromotionBatch batch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_enrollment_id", nullable = false)
    private StudentEnrollment sourceEnrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_section_id")
    private ClassSection targetSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_enrollment_id")
    private StudentEnrollment targetEnrollment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StudentPromotionDecision decision =
            StudentPromotionDecision.PENDING;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}