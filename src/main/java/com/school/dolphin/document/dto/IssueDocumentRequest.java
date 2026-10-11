package com.school.dolphin.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record IssueDocumentRequest(
        @NotNull UUID studentId,
        @NotNull UUID institutionId,
        @NotNull UUID templateId,
        @NotBlank @Size(max = 200) String title
) {}
