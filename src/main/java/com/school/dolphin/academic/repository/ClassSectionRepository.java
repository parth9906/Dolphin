package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClassSectionRepository
        extends JpaRepository<ClassSection, UUID> {

    List<ClassSection> findBySchoolClass_IdAndActiveTrueOrderByNameAsc(
            UUID schoolClassId);

    boolean existsBySchoolClass_IdAndNameIgnoreCase(
            UUID schoolClassId,
            String name
    );

    boolean existsBySchoolClass_IdAndNameIgnoreCaseAndIdNot(
            UUID schoolClassId,
            String name,
            UUID sectionId
    );

    boolean existsBySchoolClass_IdAndCampusIsNullAndNameIgnoreCaseAndIdNot(
            UUID schoolClassId,
            String name,
            UUID sectionId
    );

    boolean existsBySchoolClass_IdAndCampus_IdAndNameIgnoreCaseAndIdNot(
            UUID schoolClassId,
            UUID campusId,
            String name,
            UUID sectionId
    );

    boolean existsBySchoolClass_IdAndCampusIsNullAndNameIgnoreCase(
            UUID schoolClassId,
            String name
    );

    boolean existsBySchoolClass_IdAndCampus_IdAndNameIgnoreCase(
            UUID schoolClassId,
            UUID campusId,
            String name
    );

}
