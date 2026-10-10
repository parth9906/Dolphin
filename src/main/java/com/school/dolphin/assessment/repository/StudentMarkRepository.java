
package com.school.dolphin.assessment.repository;

import com.school.dolphin.assessment.entity.StudentMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StudentMarkRepository
        extends JpaRepository<StudentMark, UUID> {

    boolean existsByAssessment_IdAndStudent_Id(
            UUID assessmentId,
            UUID studentId
    );

    List<StudentMark> findByAssessment_IdOrderByStudent_FirstNameAsc(
            UUID assessmentId
    );

    @Query("""
    SELECT sm
    FROM StudentMark sm
    JOIN FETCH sm.assessment a
    JOIN FETCH sm.student s
    WHERE s.id = :studentId
      AND s.active = true
      AND a.active = true
      AND a.institution.id = :institutionId
      AND a.assessmentDate BETWEEN :fromDate AND :toDate
    ORDER BY a.assessmentDate, a.subjectName, a.name
    """)
    List<StudentMark> findReportCardMarks(
            @Param("studentId") UUID studentId,
            @Param("institutionId") UUID institutionId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}