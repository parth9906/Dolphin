package com.school.dolphin.academic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "school_class",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_school_class_code",
                        columnNames = {"academic_year_id", "code"}),
                @UniqueConstraint(
                        name = "uk_school_class_name",
                        columnNames = {"academic_year_id", "name"})
        })
@Getter
@Setter
@NoArgsConstructor
public class SchoolClass {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
