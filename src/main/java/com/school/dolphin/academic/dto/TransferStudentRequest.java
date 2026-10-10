package com.school.dolphin.academic.dto;


import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record TransferStudentRequest(
        @NotNull UUID targetSectionId,
        @NotNull LocalDate effectiveDate
) {}
