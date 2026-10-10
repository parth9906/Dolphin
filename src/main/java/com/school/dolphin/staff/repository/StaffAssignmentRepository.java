package com.school.dolphin.staff.repository;

import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StaffAssignmentRepository
        extends JpaRepository<StaffAssignment, UUID> {

    boolean existsByInstitution_IdAndEmployeeNumber(
            UUID institutionId,
            String employeeNumber
    );

    Optional<StaffAssignment> findByIdAndInstitution_Id(
            UUID assignmentId,
            UUID institutionId
    );

    Page<StaffAssignment> findByInstitution_IdAndStatus(
            UUID institutionId,
            StaffAssignmentStatus status,
            Pageable pageable
    );
}