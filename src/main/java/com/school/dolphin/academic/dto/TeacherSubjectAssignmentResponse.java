package com.school.dolphin.academic.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TeacherSubjectAssignmentResponse(
        UUID id,
        UUID staffAssignmentId,
        UUID staffMemberId,
        String teacherName,
        String employeeNumber,
        UUID subjectId,
        String subjectCode,
        String subjectName,
        LocalDate startDate,
        LocalDate endDate,
        boolean active
) {}