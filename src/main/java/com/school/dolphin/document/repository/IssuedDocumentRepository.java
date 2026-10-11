package com.school.dolphin.document.repository;

import com.school.dolphin.document.entity.IssuedDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssuedDocumentRepository
        extends JpaRepository<IssuedDocument, UUID> {

    List<IssuedDocument>
    findByStudent_IdAndInstitution_IdOrderByIssuedAtDesc(
            UUID studentId,
            UUID institutionId
    );

    Optional<IssuedDocument> findByIdAndInstitution_Id(
            UUID documentId,
            UUID institutionId
    );
}
