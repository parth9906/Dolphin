package com.school.dolphin.homework.dto;

import com.school.dolphin.homework.entity.AssignmentSubmission;
import com.school.dolphin.homework.entity.AssignmentSubmissionStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AssignmentSubmissionResponse(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        String submissionText,
        AssignmentSubmissionStatus status,
        OffsetDateTime submittedAt,
        OffsetDateTime updatedAt
) {
    public static AssignmentSubmissionResponse from(
            AssignmentSubmission submission
    ) {
        return new AssignmentSubmissionResponse(
                submission.getId(),
                submission.getAssignment().getId(),
                submission.getStudent().getId(),
                submission.getSubmissionText(),
                submission.getStatus(),
                submission.getSubmittedAt(),
                submission.getUpdatedAt()
        );
    }
}