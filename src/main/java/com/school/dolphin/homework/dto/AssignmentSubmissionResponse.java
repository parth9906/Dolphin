package com.school.dolphin.homework.dto;

import com.school.dolphin.homework.entity.AssignmentSubmission;
import com.school.dolphin.homework.entity.AssignmentSubmissionStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AssignmentSubmissionResponse(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        String studentAdmissionNumber,
        String studentFirstName,
        String studentLastName,
        String submissionText,
        AssignmentSubmissionStatus status,
        OffsetDateTime submittedAt,
        OffsetDateTime updatedAt,
        BigDecimal marksObtained,
        BigDecimal maxMarks,
        String feedback,
        UUID gradedByStaffId,
        OffsetDateTime gradedAt,
        Long version
) {
    public static AssignmentSubmissionResponse from(
            AssignmentSubmission submission
    ) {
        return new AssignmentSubmissionResponse(
                submission.getId(),
                submission.getAssignment().getId(),
                submission.getStudent().getId(),
                submission.getStudent().getAdmissionNumber(),
                submission.getStudent().getFirstName(),
                submission.getStudent().getLastName(),
                submission.getSubmissionText(),
                submission.getStatus(),
                submission.getSubmittedAt(),
                submission.getUpdatedAt(),
                submission.getMarksObtained(),
                submission.getAssignment().getMaxMarks(),
                submission.getFeedback(),
                submission.getGradedBy() == null
                        ? null : submission.getGradedBy().getId(),
                submission.getGradedAt(),
                submission.getVersion()
        );
    }
}
