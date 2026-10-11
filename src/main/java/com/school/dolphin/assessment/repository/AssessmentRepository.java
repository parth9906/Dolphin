
package com.school.dolphin.assessment.repository;

import com.school.dolphin.assessment.entity.Assessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRepository
        extends JpaRepository<Assessment, UUID> {

    Optional<Assessment> findByIdAndActiveTrue(UUID id);

    @Query("""
        SELECT a
        FROM Assessment a
        LEFT JOIN a.section section
        WHERE a.institution.id = :institutionId
          AND a.active = true
          AND (:sectionId IS NULL OR section.id = :sectionId)
          AND (:fromDate IS NULL OR a.assessmentDate >= :fromDate)
          AND (:toDate IS NULL OR a.assessmentDate <= :toDate)
        """)
    Page<Assessment> search(
            @Param("institutionId") UUID institutionId,
            @Param("sectionId") UUID sectionId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
        SELECT a
        FROM Assessment a
        WHERE a.institution.id = :institutionId
          AND a.active = true
          AND a.section.id IN :sectionIds
          AND (:fromDate IS NULL OR a.assessmentDate >= :fromDate)
          AND (:toDate IS NULL OR a.assessmentDate <= :toDate)
        """)
    Page<Assessment> searchBySectionIds(
            @Param("institutionId") UUID institutionId,
            @Param("sectionIds") Collection<UUID> sectionIds,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
