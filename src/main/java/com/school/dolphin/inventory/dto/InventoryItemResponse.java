package com.school.dolphin.inventory.dto;

import com.school.dolphin.inventory.entity.InventoryItem;
import com.school.dolphin.inventory.entity.InventoryItemCategory;
import com.school.dolphin.inventory.entity.InventoryUnit;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryItemResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String code,
        String name,
        InventoryItemCategory category,
        InventoryUnit unit,
        BigDecimal quantityOnHand,
        BigDecimal reorderLevel,
        boolean lowStock,
        boolean active,
        UUID createdByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Long version
) {
    public static InventoryItemResponse from(InventoryItem item) {
        return new InventoryItemResponse(
                item.getId(),
                item.getInstitution().getId(),
                item.getCampus() == null ? null : item.getCampus().getId(),
                item.getCode(),
                item.getName(),
                item.getCategory(),
                item.getUnit(),
                item.getQuantityOnHand(),
                item.getReorderLevel(),
                item.isLowStock(),
                item.isActive(),
                item.getCreatedBy().getId(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                item.getVersion()
        );
    }
}
