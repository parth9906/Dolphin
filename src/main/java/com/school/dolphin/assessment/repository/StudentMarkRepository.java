
package com.school.dolphin.assessment.repository;

import com.school.dolphin.assessment.dto.AssessmentRosterItem;
import com.school.dolphin.assessment.entity.StudentMark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
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


    @Query(
            value = """
        SELECT DISTINCT new com.school.dolphin.assessment.dto.AssessmentRosterItem(
            s.id,
            s.admissionNumber,
            s.firstName,
            s.lastName,
            sm.id,
            sm.marksObtained,
            a.maxMarks,
            sm.remarks,
            sm.version
        )
        FROM Assessment a
        JOIN StudentEnrollment e
          ON e.startDate <= a.assessmentDate
         AND (e.endDate IS NULL OR e.endDate >= a.assessmentDate)
        JOIN e.student s
        JOIN e.section cs
        LEFT JOIN StudentMark sm
          ON sm.assessment.id = a.id
         AND sm.student.id = s.id
        WHERE a.id = :assessmentId
          AND a.active = true
          AND s.active = true
          AND cs.active = true
          AND cs.schoolClass.active = true
          AND cs.schoolClass.academicYear.institution.id = a.institution.id
          AND (
              a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.CLASS
                  AND cs.schoolClass.id = a.schoolClass.id
              )
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.SECTION
                  AND cs.id = a.section.id
              )
          )
        """,
            countQuery = """
        SELECT COUNT(DISTINCT s.id)
        FROM Assessment a
        JOIN StudentEnrollment e
          ON e.startDate <= a.assessmentDate
         AND (e.endDate IS NULL OR e.endDate >= a.assessmentDate)
        JOIN e.student s
        JOIN e.section cs
        WHERE a.id = :assessmentId
          AND a.active = true
          AND s.active = true
          AND cs.active = true
          AND cs.schoolClass.active = true
          AND cs.schoolClass.academicYear.institution.id = a.institution.id
          AND (
              a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.CLASS
                  AND cs.schoolClass.id = a.schoolClass.id
              )
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.SECTION
                  AND cs.id = a.section.id
              )
          )
        """
    )
    Page<AssessmentRosterItem> findAssessmentRoster(
            @Param("assessmentId") UUID assessmentId,
            Pageable pageable);

    @Query(
            value = """
        SELECT DISTINCT new com.school.dolphin.assessment.dto.AssessmentRosterItem(
            s.id,
            s.admissionNumber,
            s.firstName,
            s.lastName,
            sm.id,
            sm.marksObtained,
            a.maxMarks,
            sm.remarks,
            sm.version
        )
        FROM Assessment a
        JOIN StudentEnrollment e
          ON e.startDate <= a.assessmentDate
         AND (e.endDate IS NULL OR e.endDate >= a.assessmentDate)
        JOIN e.student s
        JOIN e.section cs
        LEFT JOIN StudentMark sm
          ON sm.assessment.id = a.id
         AND sm.student.id = s.id
        WHERE a.id = :assessmentId
          AND a.active = true
          AND s.active = true
          AND cs.active = true
          AND cs.schoolClass.active = true
          AND cs.schoolClass.academicYear.institution.id = a.institution.id
          AND cs.id IN :allowedSectionIds
          AND (
              a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.CLASS
                  AND cs.schoolClass.id = a.schoolClass.id
              )
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.SECTION
                  AND cs.id = a.section.id
              )
          )
        """,
            countQuery = """
        SELECT COUNT(DISTINCT s.id)
        FROM Assessment a
        JOIN StudentEnrollment e
          ON e.startDate <= a.assessmentDate
         AND (e.endDate IS NULL OR e.endDate >= a.assessmentDate)
        JOIN e.student s
        JOIN e.section cs
        WHERE a.id = :assessmentId
          AND a.active = true
          AND s.active = true
          AND cs.active = true
          AND cs.schoolClass.active = true
          AND cs.schoolClass.academicYear.institution.id = a.institution.id
          AND cs.id IN :allowedSectionIds
          AND (
              a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.INSTITUTION
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.CLASS
                  AND cs.schoolClass.id = a.schoolClass.id
              )
              OR (
                  a.scopeType = com.school.dolphin.assessment.entity.AssessmentScope.SECTION
                  AND cs.id = a.section.id
              )
          )
        """
    )
    Page<AssessmentRosterItem> findAssessmentRosterForSections(
            @Param("assessmentId") UUID assessmentId,
            @Param("allowedSectionIds") Collection<UUID> allowedSectionIds,
            Pageable pageable);

}