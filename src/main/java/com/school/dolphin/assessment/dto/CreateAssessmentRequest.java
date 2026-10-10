
package com.school.dolphin.assessment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAssessmentRequest(
        @NotNull UUID institutionId,
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 100) String subjectName,
        @NotNull LocalDate assessmentDate,
        @NotNull @DecimalMin(value = "0.01") BigDecimal maxMarks
) {}