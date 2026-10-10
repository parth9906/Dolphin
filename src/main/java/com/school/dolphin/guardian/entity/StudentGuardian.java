
package com.school.dolphin.guardian.entity;

import com.school.dolphin.student.entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "student_guardian",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_student_guardian",
                columnNames = {"student_id", "guardian_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentGuardian {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "relationship_type", nullable = false, length = 30)
    private String relationshipType;

    @Column(name = "primary_contact", nullable = false)
    private boolean primaryContact;

    @Column(name = "pickup_authorized", nullable = false)
    private boolean pickupAuthorized;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;


    @Column(nullable = false)
    private boolean active;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
        active = true;
    }
}