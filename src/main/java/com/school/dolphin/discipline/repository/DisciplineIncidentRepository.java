package com.school.dolphin.discipline.repository;

import com.school.dolphin.discipline.entity.DisciplineIncident;
import com.school.dolphin.discipline.entity.DisciplineIncidentStatus;
import com.school.dolphin.discipline.entity.DisciplineSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface DisciplineIncidentRepository
        extends JpaRepository<DisciplineIncident, UUID> {

    @Query("""
        SELECT i
        FROM DisciplineIncident i
        LEFT JOIN i.campus c
        WHERE i.institution.id = :institutionId
          AND (:studentId IS NULL OR i.student.id = :studentId)
          AND (:campusId IS NULL OR c.id = :campusId)
          AND (:status IS NULL OR i.status = :status)
          AND (:severity IS NULL OR i.severity = :severity)
          AND (:fromDate IS NULL OR i.incidentDate >= :fromDate)
          AND (:toDate IS NULL OR i.incidentDate <= :toDate)
        """)
    Page<DisciplineIncident> search(
            @Param("institutionId") UUID institutionId,
            @Param("studentId") UUID studentId,
            @Param("campusId") UUID campusId,
            @Param("status") DisciplineIncidentStatus status,
            @Param("severity") DisciplineSeverity severity,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
