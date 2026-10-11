package com.school.dolphin.mess.dto;

import com.school.dolphin.mess.entity.MessMealType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateMessMealRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotNull MessMealType mealType,
        @NotNull @PastOrPresent LocalDate servedOn,
        @NotNull @Min(1) Integer headcount,
        @Size(max = 1000) String notes,
        @NotEmpty @Size(max = 100) @Valid
        List<MessConsumptionRequest> consumptions
) {}
