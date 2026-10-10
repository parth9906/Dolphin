package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.AcademicYear;
import com.school.dolphin.academic.entity.AcademicYearStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AcademicYearRepository
        extends JpaRepository<AcademicYear, UUID> {

    List<AcademicYear> findByInstitution_IdOrderByStartDateDesc(
            UUID institutionId);

    boolean existsByInstitution_IdAndNameIgnoreCase(
            UUID institutionId, String name);

    boolean existsByInstitution_IdAndStatus(
            UUID institutionId,
            AcademicYearStatus status);
}
