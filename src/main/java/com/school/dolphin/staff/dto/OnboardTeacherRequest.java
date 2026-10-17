
package com.school.dolphin.staff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record OnboardTeacherRequest(
        @NotBlank
        @Size(max = 100)
        String username,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @NotNull
        UUID institutionId,

        UUID campusId,

        @NotBlank
        @Size(max = 50)
        String employeeNumber,

        @NotBlank
        @Size(max = 120)
        String jobTitle,

        @NotNull
        LocalDate startDate,

        @Size(max = 30)
        String phone
) {}
