package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.entity.StudentEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
