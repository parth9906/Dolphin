package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.entity.StudentEnrollment;
import com.school.dolphin.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StudentEnrollmentRepository
        extends JpaRepository<StudentEnrollment, UUID> {

    boolean existsByStudent_IdAndStatus(
            UUID studentId, EnrollmentStatus status);

    Page<StudentEnrollment> findBySection_IdAndStatus(
            UUID sectionId, EnrollmentStatus status, Pageable pageable);


    List<StudentEnrollment> findByStudent_IdOrderByStartDateDesc(UUID studentId);

    long countBySection_IdAndStatus(
            UUID sectionId,
            EnrollmentStatus status
    );

    boolean existsBySection_SchoolClass_AcademicYear_IdAndStatus(
            UUID academicYearId,
            EnrollmentStatus status
    );

    @Query(value = """
    SELECT s.*
      FROM student s
      JOIN student_enrollment e ON e.student_id = s.id
     WHERE e.section_id = :sectionId
       AND e.status = 'ACTIVE'
       AND e.start_date <= :lessonDate
       AND (e.end_date IS NULL OR e.end_date >= :lessonDate)
     ORDER BY s.last_name, s.first_name
    """, nativeQuery = true)
    List<Student> findActiveRosterForSectionOnDate(
            @Param("sectionId") UUID sectionId,
            @Param("lessonDate") LocalDate lessonDate);

    List<StudentEnrollment> findByStudent_IdAndStatus(
            UUID studentId,
            EnrollmentStatus status
    );
}
