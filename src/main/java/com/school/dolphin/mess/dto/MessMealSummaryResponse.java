package com.school.dolphin.mess.dto;

import com.school.dolphin.mess.entity.MessMealRecord;
import com.school.dolphin.mess.entity.MessMealType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MessMealSummaryResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        MessMealType mealType,
        LocalDate servedOn,
        int headcount,
        String notes,
        UUID recordedByUserId,
        OffsetDateTime createdAt
) {
    public static MessMealSummaryResponse from(MessMealRecord meal) {
        return new MessMealSummaryResponse(
                meal.getId(),
                meal.getInstitution().getId(),
                meal.getCampus() == null ? null : meal.getCampus().getId(),
                meal.getMealType(),
                meal.getServedOn(),
                meal.getHeadcount(),
                meal.getNotes(),
                meal.getRecordedBy().getId(),
                meal.getCreatedAt()
        );
    }
}
