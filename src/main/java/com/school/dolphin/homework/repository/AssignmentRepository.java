package com.school.dolphin.homework.repository;

import com.school.dolphin.homework.entity.Assignment;
import com.school.dolphin.homework.entity.AssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository
        extends JpaRepository<Assignment, UUID> {

    @Query("""
        SELECT a
        FROM Assignment a
        WHERE a.id = :id
          AND a.institution.id = :institutionId
        """)
    Optional<Assignment> findByIdAndInstitutionId(
            @Param("id") UUID id,
            @Param("institutionId") UUID institutionId
    );

    @Query("""
        SELECT a
        FROM Assignment a
        WHERE a.institution.id = :institutionId
          AND (:sectionId IS NULL OR a.section.id = :sectionId)
          AND (:status IS NULL OR a.status = :status)
        """)
    Page<Assignment> search(
            @Param("institutionId") UUID institutionId,
            @Param("sectionId") UUID sectionId,
            @Param("status") AssignmentStatus status,
            Pageable pageable
    );

    Page<Assignment> findBySection_IdInAndStatus(
            Collection<UUID> sectionIds,
            AssignmentStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT a
        FROM Assignment a
        WHERE a.institution.id = :institutionId
          AND a.section.id IN :sectionIds
          AND (:status IS NULL OR a.status = :status)
        """)
    Page<Assignment> searchBySectionIds(
            @Param("institutionId") UUID institutionId,
            @Param("sectionIds") Collection<UUID> sectionIds,
            @Param("status") AssignmentStatus status,
            Pageable pageable
    );
}
