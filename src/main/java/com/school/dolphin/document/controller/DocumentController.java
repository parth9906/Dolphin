package com.school.dolphin.document.controller;

import com.school.dolphin.document.dto.CreateDocumentTemplateRequest;
import com.school.dolphin.document.dto.DocumentTemplateResponse;
import com.school.dolphin.document.dto.IssueDocumentRequest;
import com.school.dolphin.document.dto.IssuedDocumentResponse;
import com.school.dolphin.document.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/api/v1/documents/templates")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DOCUMENT_TEMPLATE_CREATE')")
    public DocumentTemplateResponse createTemplate(
            @Valid @RequestBody CreateDocumentTemplateRequest request,
            Authentication authentication
    ) {
        return documentService.createTemplate(request, authentication);
    }

    @GetMapping("/api/v1/documents/templates")
    @PreAuthorize("hasAuthority('DOCUMENT_TEMPLATE_READ')")
    public List<DocumentTemplateResponse> listTemplates(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return documentService.listTemplates(institutionId, authentication);
    }

    @PostMapping("/api/v1/documents/issue")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DOCUMENT_ISSUE')")
    public IssuedDocumentResponse issue(
            @Valid @RequestBody IssueDocumentRequest request,
            Authentication authentication
    ) {
        return documentService.issue(request, authentication);
    }

    @GetMapping("/api/v1/documents/{documentId}")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public IssuedDocumentResponse getDocument(
            @PathVariable UUID documentId,
            Authentication authentication
    ) {
        return documentService.getDocument(documentId, authentication);
    }

    @GetMapping("/api/v1/students/{studentId}/documents")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public List<IssuedDocumentResponse> listStudentDocuments(
            @PathVariable UUID studentId,
            Authentication authentication
    ) {
        return documentService.listStudentDocuments(studentId, authentication);
    }
}
