package com.school.dolphin.inventory.dto;

import com.school.dolphin.inventory.entity.InventoryReferenceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RecordStockMovementRequest(
        @NotNull @DecimalMin(value = "0.000", inclusive = false)
        @Digits(integer = 11, fraction = 3) BigDecimal quantity,
        InventoryReferenceType referenceType,
        UUID referenceId,
        @Size(max = 500) String remarks,
        OffsetDateTime occurredAt
) {}
