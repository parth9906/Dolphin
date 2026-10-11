package com.school.dolphin.document.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.document.dto.CreateDocumentTemplateRequest;
import com.school.dolphin.document.dto.DocumentTemplateResponse;
import com.school.dolphin.document.dto.IssueDocumentRequest;
import com.school.dolphin.document.dto.IssuedDocumentResponse;
import com.school.dolphin.document.entity.DocumentTemplate;
import com.school.dolphin.document.entity.IssuedDocument;
import com.school.dolphin.document.repository.DocumentTemplateRepository;
import com.school.dolphin.document.repository.IssuedDocumentRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import com.school.dolphin.student.service.CurrentStudentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentTemplateRepository documentTemplateRepository;
    private final IssuedDocumentRepository issuedDocumentRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final CurrentStudentResolver currentStudentResolver;

    @Transactional
    public DocumentTemplateResponse createTemplate(
            CreateDocumentTemplateRequest request,
            Authentication authentication
    ) {
        Institution institution = requireActiveInstitution(
                request.institutionId(), authentication);

        String code = request.code().trim();

        if (documentTemplateRepository
                .existsByInstitution_IdAndCode(institution.getId(), code)) {
            throw new DuplicateResourceException(
                    "Template code already exists in this institution");
        }

        DocumentTemplate template = new DocumentTemplate();
        template.setInstitution(institution);
        template.setCode(code);
        template.setName(request.name().trim());
        template.setBody(request.body().trim());

        return toTemplateResponse(
                documentTemplateRepository.save(template));
    }

    @Transactional(readOnly = true)
    public List<DocumentTemplateResponse> listTemplates(
            UUID institutionId,
            Authentication authentication
    ) {
        requireActiveInstitution(institutionId, authentication);

        return documentTemplateRepository
                .findByInstitution_IdAndActiveTrueOrderByNameAsc(institutionId)
                .stream()
                .map(this::toTemplateResponse)
                .toList();
    }

    @Transactional
    public IssuedDocumentResponse issue(
            IssueDocumentRequest request,
            Authentication authentication
    ) {
        Institution institution = requireActiveInstitution(
                request.institutionId(), authentication);

        Student student = studentRepository.findByIdAndActiveTrue(
                        request.studentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Active student not found"));

        if (!student.getInstitution().getId()
                .equals(institution.getId())) {
            throw new AccessDeniedException(
                    "Student does not belong to this institution");
        }

        DocumentTemplate template = documentTemplateRepository
                .findByIdAndInstitution_IdAndActiveTrue(
                        request.templateId(), institution.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Active template not found in this institution"));

        UserAccount issuer =
                authenticatedUserResolver.requireUserAccount(authentication);

        IssuedDocument document = new IssuedDocument(
                student,
                institution,
                template,
                request.title().trim(),
                render(template.getBody(), student, institution),
                issuer);

        return toIssuedResponse(
                issuedDocumentRepository.save(document));
    }

    @Transactional(readOnly = true)
    public IssuedDocumentResponse getDocument(
            UUID documentId,
            Authentication authentication
    ) {
        IssuedDocument document = requireDocument(documentId, authentication);

        return toIssuedResponse(document);
    }

    @Transactional(readOnly = true)
    public List<IssuedDocumentResponse> listStudentDocuments(
            UUID studentId,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Active student not found"));

        requireActiveInstitution(student.getInstitution().getId(), authentication);

        return issuedDocumentRepository
                .findByStudent_IdAndInstitution_IdOrderByIssuedAtDesc(
                        studentId, student.getInstitution().getId())
                .stream()
                .map(this::toIssuedResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IssuedDocumentResponse> listMyDocuments(
            Authentication authentication
    ) {
        Student student = currentStudentResolver.requireStudent(authentication);

        if (!student.isActive()) {
            throw new AccessDeniedException(
                    "Inactive students cannot access the student portal");
        }

        return issuedDocumentRepository
                .findByStudent_IdAndInstitution_IdOrderByIssuedAtDesc(
                        student.getId(), student.getInstitution().getId())
                .stream()
                .map(this::toIssuedResponse)
                .toList();
    }

    private IssuedDocument requireDocument(
            UUID documentId,
            Authentication authentication
    ) {
        IssuedDocument document = issuedDocumentRepository
                .findById(documentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Document not found"));

        requireActiveInstitution(
                document.getInstitution().getId(), authentication);

        return document;
    }

    private Institution requireActiveInstitution(
            UUID institutionId,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(institutionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found"));

        if (!institution.isActive()) {
            throw new AccessDeniedException(
                    "Inactive institutions cannot host document workflows");
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        return institution;
    }

    private String render(
            String body,
            Student student,
            Institution institution
    ) {
        String studentName = (student.getFirstName() + " "
                + (student.getLastName() == null
                ? "" : student.getLastName())).trim();

        return body
                .replace("{{student_name}}", studentName)
                .replace("{{student_id}}", student.getId().toString())
                .replace("{{admission_number}}", student.getAdmissionNumber())
                .replace("{{institution_name}}", institution.getName())
                .replace("{{issue_date}}", LocalDate.now().toString());
    }

    private DocumentTemplateResponse toTemplateResponse(
            DocumentTemplate template
    ) {
        return new DocumentTemplateResponse(
                template.getId(),
                template.getInstitution().getId(),
                template.getCode(),
                template.getName(),
                template.getBody(),
                template.isActive());
    }

    private IssuedDocumentResponse toIssuedResponse(
            IssuedDocument document
    ) {
        return new IssuedDocumentResponse(
                document.getId(),
                document.getStudent().getId(),
                document.getInstitution().getId(),
                document.getTemplate().getId(),
                document.getTemplate().getName(),
                document.getTitle(),
                document.getContent(),
                document.getIssuedBy().getId(),
                document.getIssuedAt());
    }
}
