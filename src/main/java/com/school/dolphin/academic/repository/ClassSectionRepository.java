package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClassSectionRepository
        extends JpaRepository<ClassSection, UUID> {

    List<ClassSection> findBySchoolClass_IdAndActiveTrueOrderByNameAsc(
            UUID schoolClassId);
}
