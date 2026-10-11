package com.school.dolphin.admissions.repository;

import com.school.dolphin.admissions.entity.AdmissionApplication;
import com.school.dolphin.admissions.entity.AdmissionApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AdmissionApplicationRepository
        extends JpaRepository<AdmissionApplication, UUID> {

    long countByInstitution_IdAndApplicantFirstNameIgnoreCaseAndApplicantLastNameIgnoreCaseAndApplicantDateOfBirthAndStatusIn(
            UUID institutionId,
            String applicantFirstName,
            String applicantLastName,
            LocalDate applicantDateOfBirth,
            List<AdmissionApplicationStatus> statuses
    );

    @Query("""
        SELECT a
        FROM AdmissionApplication a
        LEFT JOIN a.campus c
        WHERE a.institution.id = :institutionId
          AND (:campusId IS NULL OR c.id = :campusId)
          AND (:status IS NULL OR a.status = :status)
          AND (:fromDate IS NULL OR a.applicationDate >= :fromDate)
          AND (:toDate IS NULL OR a.applicationDate <= :toDate)
        """)
    Page<AdmissionApplication> search(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("status") AdmissionApplicationStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
        SELECT a.status AS status, COUNT(a) AS cnt
        FROM AdmissionApplication a
        LEFT JOIN a.campus c
        WHERE a.institution.id = :institutionId
          AND (:campusId IS NULL OR c.id = :campusId)
          AND (:fromDate IS NULL OR a.applicationDate >= :fromDate)
          AND (:toDate IS NULL OR a.applicationDate <= :toDate)
        GROUP BY a.status
        """)
    List<StatusCountProjection> countByStatus(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    interface StatusCountProjection {
        AdmissionApplicationStatus getStatus();

        long getCnt();
    }
}
