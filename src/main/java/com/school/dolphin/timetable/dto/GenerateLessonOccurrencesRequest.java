package com.school.dolphin.timetable.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;

public record GenerateLessonOccurrencesRequest(
        @NotNull UUID sectionId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate) {

    @AssertTrue(message = "End date must be on or after start date")
    public boolean isDateRangeValid() {
        return startDate == null
                || endDate == null
                || !endDate.isBefore(startDate);
    }
}

