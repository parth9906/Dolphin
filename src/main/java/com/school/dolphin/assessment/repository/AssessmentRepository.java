
package com.school.dolphin.assessment.repository;

import com.school.dolphin.assessment.entity.Assessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRepository
        extends JpaRepository<Assessment, UUID> {

    Optional<Assessment> findByIdAndActiveTrue(UUID id);

    boolean existsByIdAndActiveTrue(UUID id);

    @Query("""
        SELECT a
        FROM Assessment a
        WHERE a.institution.id = :institutionId
          AND a.active = true
          AND (
                :sectionId IS NULL
                OR a.scopeType =
                    com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
                OR a.section.id = :sectionId
                OR a.schoolClass.id = (
                    SELECT cs.schoolClass.id
                    FROM ClassSection cs
                    WHERE cs.id = :sectionId
                )
          )
          AND (:fromDate IS NULL OR a.assessmentDate >= :fromDate)
          AND (:toDate IS NULL OR a.assessmentDate <= :toDate)
        """)
    Page<Assessment> search(
            @Param("institutionId") UUID institutionId,
            @Param("sectionId") UUID sectionId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("""
        SELECT a
        FROM Assessment a
        WHERE a.institution.id = :institutionId
          AND a.active = true
          AND (
                a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
                OR a.section.id IN :sectionIds
                OR a.schoolClass.id IN (
                    SELECT cs.schoolClass.id
                    FROM ClassSection cs
                    WHERE cs.id IN :sectionIds
                )
          )
          AND (:fromDate IS NULL OR a.assessmentDate >= :fromDate)
          AND (:toDate IS NULL OR a.assessmentDate <= :toDate)
        """)
    Page<Assessment> searchAccessibleToSections(
            @Param("institutionId") UUID institutionId,
            @Param("sectionIds") Collection<UUID> sectionIds,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    @Query("""
        SELECT MAX(sm.marksObtained)
        FROM StudentMark sm
        WHERE sm.assessment.id = :assessmentId
        """)
    BigDecimal findHighestRecordedMark(
            @Param("assessmentId") UUID assessmentId);
}
