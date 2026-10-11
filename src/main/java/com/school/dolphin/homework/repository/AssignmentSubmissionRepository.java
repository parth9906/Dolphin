package com.school.dolphin.homework.repository;

import com.school.dolphin.homework.entity.AssignmentSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AssignmentSubmissionRepository
        extends JpaRepository<AssignmentSubmission, UUID> {

    Optional<AssignmentSubmission> findByAssignment_IdAndStudent_Id(
            UUID assignmentId,
            UUID studentId
    );

    @EntityGraph(attributePaths = "student")
    Page<AssignmentSubmission> findByAssignment_Id(
            UUID assignmentId,
            Pageable pageable
    );

    Optional<AssignmentSubmission> findByIdAndAssignment_Id(
            UUID id,
            UUID assignmentId
    );
}
