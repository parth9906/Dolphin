package com.school.dolphin.document.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record IssuedDocumentResponse(
        UUID id,
        UUID studentId,
        UUID institutionId,
        UUID templateId,
        String templateName,
        String title,
        String content,
        UUID issuedByUserId,
        OffsetDateTime issuedAt
) {}
