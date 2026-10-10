package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.AcademicSubject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AcademicSubjectRepository
        extends JpaRepository<AcademicSubject, UUID> {

    boolean existsByInstitution_IdAndCodeIgnoreCase(
            UUID institutionId, String code);

    boolean existsByInstitution_IdAndNameIgnoreCase(
            UUID institutionId, String name);

    List<AcademicSubject> findByInstitution_IdAndActiveTrueOrderByNameAsc(
            UUID institutionId);
}