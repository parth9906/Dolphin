package com.school.dolphin.inventory.dto;

import com.school.dolphin.inventory.entity.InventoryItemCategory;
import com.school.dolphin.inventory.entity.InventoryUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateInventoryItemRequest(
        @NotBlank @Size(max = 200) String name,
        @NotNull InventoryItemCategory category,
        @NotNull InventoryUnit unit,
        @NotNull @DecimalMin("0.000")
        @Digits(integer = 11, fraction = 3) BigDecimal reorderLevel,
        @NotNull Long version
) {}
