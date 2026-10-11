package com.school.dolphin.student.entity;

import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "student",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_student_institution_admission",
                        columnNames = {"institution_id", "admission_number"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id")
    private Campus campus;

    @Column(name = "admission_number", nullable = false, length = 50)
    private String admissionNumber;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

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
