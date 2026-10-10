package com.school.dolphin.staff.entity;

import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "staff_assignment",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_staff_employee_number",
                columnNames = {"institution_id", "employee_number"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class StaffAssignment {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_member_id", nullable = false)
    private StaffMember staffMember;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id")
    private Campus campus;

    @Column(name = "employee_number", nullable = false, length = 50)
    private String employeeNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "staff_type", nullable = false, length = 30)
    private StaffType staffType;

    @Column(name = "job_title", nullable = false, length = 120)
    private String jobTitle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffAssignmentStatus status = StaffAssignmentStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}