package com.school.dolphin.academic.dto;


import com.school.dolphin.academic.entity.EnrollmentStatus;

import java.time.LocalDate;
import java.util.UUID;

public record StudentEnrollmentResponse(
        UUID id,
        UUID studentId,
        String admissionNumber,
        String studentName,
        UUID sectionId,
        String sectionName,
        UUID classId,
        String className,
        UUID academicYearId,
        String academicYearName,
        LocalDate startDate,
        LocalDate endDate,
        EnrollmentStatus status
) {}
