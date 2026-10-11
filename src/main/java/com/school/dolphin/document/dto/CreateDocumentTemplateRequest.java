package com.school.dolphin.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDocumentTemplateRequest(
        @NotNull UUID institutionId,
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 20000) String body
) {}
