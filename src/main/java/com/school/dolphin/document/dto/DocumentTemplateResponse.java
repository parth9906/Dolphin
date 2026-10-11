package com.school.dolphin.document.dto;

import java.util.UUID;

public record DocumentTemplateResponse(
        UUID id,
        UUID institutionId,
        String code,
        String name,
        String body,
        boolean active
) {}
