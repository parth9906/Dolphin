package com.school.dolphin.academic.dto;


import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EnrollmentEndRequest(
        @NotNull LocalDate endDate
) {}
