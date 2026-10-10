package com.school.dolphin.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateStudentRequest(

        @NotNull(message = "Institution ID is required")
        UUID institutionId,

        UUID campusId,

        @NotBlank(message = "Admission number is required")
        @Size(max = 50, message = "Admission number must not exceed 50 characters")
        String admissionNumber,

        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        LocalDate dateOfBirth
) {}