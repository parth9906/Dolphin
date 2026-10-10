
package com.school.dolphin.guardian.repository;

import com.school.dolphin.guardian.entity.StudentGuardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentGuardianRepository
        extends JpaRepository<StudentGuardian, UUID> {

    boolean existsByStudent_IdAndGuardian_Id(
            UUID studentId,
            UUID guardianId
    );

    List<StudentGuardian> findByStudent_IdAndGuardian_ActiveTrue(
            UUID studentId
    );

    boolean existsByStudent_IdAndPrimaryContactTrue(UUID studentId);


    boolean existsByStudent_IdAndGuardian_IdAndActiveTrue(
            UUID studentId,
            UUID guardianId
    );

    boolean existsByStudent_IdAndPrimaryContactTrueAndActiveTrue(
            UUID studentId
    );

    List<StudentGuardian> findByGuardian_IdAndActiveTrue(UUID guardianId);

    Optional<StudentGuardian> findByStudent_IdAndGuardian_IdAndActiveTrue(
            UUID studentId,
            UUID guardianId
    );

    @Query("""
    SELECT sg
    FROM StudentGuardian sg
    JOIN FETCH sg.guardian g
    WHERE sg.student.id = :studentId
      AND sg.active = true
      AND g.active = true
    ORDER BY sg.primaryContact DESC, g.firstName ASC
    """)
    List<StudentGuardian> findActiveGuardiansForStudent(
            @Param("studentId") UUID studentId
    );


    @Query("""
    SELECT sg
    FROM StudentGuardian sg
    JOIN FETCH sg.student s
    JOIN FETCH sg.guardian g
    WHERE g.userAccount.id = :userId
      AND g.active = true
      AND sg.active = true
      AND s.active = true
    ORDER BY s.firstName ASC, s.lastName ASC
    """)
    List<StudentGuardian> findActiveStudentsForGuardianAccount(
            @Param("userId") UUID userId
    );

    @Query("""
    SELECT sg
    FROM StudentGuardian sg
    JOIN FETCH sg.student s
    JOIN FETCH sg.guardian g
    WHERE g.userAccount.id = :userId
      AND s.id = :studentId
      AND g.active = true
      AND sg.active = true
      AND s.active = true
    """)
    Optional<StudentGuardian> findActiveStudentForGuardianAccount(
            @Param("userId") UUID userId,
            @Param("studentId") UUID studentId
    );
}