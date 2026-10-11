package com.school.dolphin.document.controller;

import com.school.dolphin.document.dto.IssuedDocumentResponse;
import com.school.dolphin.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student-portal/documents")
@RequiredArgsConstructor
public class StudentDocumentController {

    private final DocumentService documentService;

    @GetMapping
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public List<IssuedDocumentResponse> getMyDocuments(
            Authentication authentication
    ) {
        return documentService.listMyDocuments(authentication);
    }
}
