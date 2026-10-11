package com.school.dolphin.mess.dto;

import com.school.dolphin.mess.entity.MessMealRecord;
import com.school.dolphin.mess.entity.MessMealType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record MessMealResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        MessMealType mealType,
        LocalDate servedOn,
        int headcount,
        String notes,
        UUID recordedByUserId,
        OffsetDateTime createdAt,
        List<MessConsumptionResponse> consumptions
) {
    public static MessMealResponse from(
            MessMealRecord meal,
            List<MessConsumptionResponse> consumptions
    ) {
        return new MessMealResponse(
                meal.getId(),
                meal.getInstitution().getId(),
                meal.getCampus() == null ? null : meal.getCampus().getId(),
                meal.getMealType(),
                meal.getServedOn(),
                meal.getHeadcount(),
                meal.getNotes(),
                meal.getRecordedBy().getId(),
                meal.getCreatedAt(),
                consumptions
        );
    }
}
