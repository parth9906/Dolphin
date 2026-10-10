package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SchoolClassRepository
        extends JpaRepository<SchoolClass, UUID> {

    List<SchoolClass> findByAcademicYear_IdAndActiveTrueOrderBySortOrderAsc(
            UUID academicYearId);
}
