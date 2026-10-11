package com.school.dolphin.document.repository;

import com.school.dolphin.document.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentTemplateRepository
        extends JpaRepository<DocumentTemplate, UUID> {

    List<DocumentTemplate> findByInstitution_IdAndActiveTrueOrderByNameAsc(
            UUID institutionId
    );

    boolean existsByInstitution_IdAndCode(UUID institutionId, String code);

    Optional<DocumentTemplate> findByIdAndInstitution_IdAndActiveTrue(
            UUID templateId,
            UUID institutionId
    );
}
