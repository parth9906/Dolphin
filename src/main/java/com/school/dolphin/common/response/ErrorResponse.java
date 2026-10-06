package com.school.dolphin.common.response;

import java.time.OffsetDateTime;

public record ErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String code,
        String message,
        String path
) {
}