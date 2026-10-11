package com.school.dolphin.student.dto;

import com.school.dolphin.student.entity.StudentAccountLink;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StudentAccountLinkResponse(
        UUID id,
        UUID studentId,
        UUID userAccountId,
        OffsetDateTime createdAt
) {
    public static StudentAccountLinkResponse from(StudentAccountLink link) {
        return new StudentAccountLinkResponse(
                link.getId(),
                link.getStudent().getId(),
                link.getUserAccount().getId(),
                link.getCreatedAt()
        );
    }
}
