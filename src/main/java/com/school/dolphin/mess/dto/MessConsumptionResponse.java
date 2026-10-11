package com.school.dolphin.mess.dto;

import com.school.dolphin.inventory.entity.InventoryUnit;

import java.math.BigDecimal;
import java.util.UUID;

public record MessConsumptionResponse(
        UUID itemId,
        String itemCode,
        String itemName,
        InventoryUnit unit,
        BigDecimal quantity
) {}
