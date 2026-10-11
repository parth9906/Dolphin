package com.school.dolphin.hostel.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateHostelAllocationRequest(
        @NotNull UUID studentId,
        @NotNull UUID roomId,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @Size(max = 500) String notes
) {}
