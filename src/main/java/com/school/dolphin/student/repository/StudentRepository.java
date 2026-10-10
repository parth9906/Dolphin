package com.school.dolphin.student.repository;

import com.school.dolphin.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {

    boolean existsByInstitution_IdAndAdmissionNumber(
            UUID institutionId,
            String admissionNumber
    );

    Optional<Student> findByIdAndActiveTrue(UUID id);


    boolean existsByInstitution_IdAndAdmissionNumberAndIdNot(
            UUID institutionId,
            String admissionNumber,
            UUID studentId
    );


    List<Student> findByIdInAndInstitution_IdAndActiveTrue(
            Collection<UUID> studentIds,
            UUID institutionId
    );

    @Query(
            value = """
        SELECT s
        FROM Student s
        WHERE s.institution.id = :institutionId
          AND s.active = true
          AND (
              :campusId IS NULL
              OR s.campus.id = :campusId
          )
          AND (
              :search IS NULL
              OR LOWER(s.admissionNumber)
                    LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(s.firstName)
                    LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(COALESCE(s.lastName, ''))
                    LIKE LOWER(CONCAT('%', :search, '%'))
          )
        """,
            countQuery = """
        SELECT COUNT(s)
        FROM Student s
        WHERE s.institution.id = :institutionId
          AND s.active = true
          AND (
              :campusId IS NULL
              OR s.campus.id = :campusId
          )
          AND (
              :search IS NULL
              OR LOWER(s.admissionNumber)
                    LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(s.firstName)
                    LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(COALESCE(s.lastName, ''))
                    LIKE LOWER(CONCAT('%', :search, '%'))
          )
        """
    )
    Page<Student> searchActiveStudents(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("search") String search,
            Pageable pageable
    );
}