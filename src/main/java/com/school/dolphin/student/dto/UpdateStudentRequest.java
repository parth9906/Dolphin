
package com.school.dolphin.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateStudentRequest(

        @NotBlank
        @Size(max = 50)
        String admissionNumber,

        @NotBlank
        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        LocalDate dateOfBirth
) {}