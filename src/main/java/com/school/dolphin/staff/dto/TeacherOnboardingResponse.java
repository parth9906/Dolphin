
package com.school.dolphin.staff.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeacherOnboardingResponse(
        UUID userAccountId,
        UUID staffMemberId,
        UUID staffAssignmentId,
        UUID institutionId,
        UUID campusId,
        String username,
        String email,
        String roleCode,
        String staffStatus,
        String invitationStatus,
        OffsetDateTime invitationExpiresAt,
        String message
) {}
