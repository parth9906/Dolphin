package com.school.dolphin.staff.dto;

import com.school.dolphin.staff.entity.StaffType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateStaffRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        UUID userAccountId,

        @NotBlank @Size(max = 100)
        String firstName,

        @NotBlank @Size(max = 100)
        String lastName,

        @Email @Size(max = 255)
        String email,

        @Size(max = 30)
        String phone,

        @NotBlank @Size(max = 50)
        String employeeNumber,

        @NotNull
        StaffType staffType,

        @NotBlank @Size(max = 120)
        String jobTitle,

        @NotNull
        LocalDate startDate
) {}