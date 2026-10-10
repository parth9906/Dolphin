package com.school.dolphin.assessment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StudentReportCardResponse(
        UUID studentId,
        String admissionNumber,
        String firstName,
        String lastName,
        UUID institutionId,
        LocalDate fromDate,
        LocalDate toDate,
        int assessmentCount,
        BigDecimal totalMarksObtained,
        BigDecimal totalMaximumMarks,
        BigDecimal overallPercentage,
        String overallGrade,
        List<SubjectResultResponse> subjects,
        List<AssessmentResultItem> assessments
) {}