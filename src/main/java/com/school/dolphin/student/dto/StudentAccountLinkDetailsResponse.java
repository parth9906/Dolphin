
package com.school.dolphin.student.dto;

import com.school.dolphin.student.entity.StudentAccountLink;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StudentAccountLinkDetailsResponse(
        boolean linked,
        UUID id,
        UUID studentId,
        UUID userAccountId,
        String username,
        String email,
        OffsetDateTime createdAt
) {

    public static StudentAccountLinkDetailsResponse notLinked(
            UUID studentId
    ) {
        return new StudentAccountLinkDetailsResponse(
                false,
                null,
                studentId,
                null,
                null,
                null,
                null
        );
    }

    public static StudentAccountLinkDetailsResponse from(
            StudentAccountLink link
    ) {
        return new StudentAccountLinkDetailsResponse(
                true,
                link.getId(),
                link.getStudent().getId(),
                link.getUserAccount().getId(),
                link.getUserAccount().getUsername(),
                link.getUserAccount().getEmail(),
                link.getCreatedAt()
        );
    }
}
