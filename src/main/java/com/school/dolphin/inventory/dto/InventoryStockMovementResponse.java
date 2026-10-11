package com.school.dolphin.inventory.dto;

import com.school.dolphin.inventory.entity.InventoryMovementDirection;
import com.school.dolphin.inventory.entity.InventoryMovementType;
import com.school.dolphin.inventory.entity.InventoryReferenceType;
import com.school.dolphin.inventory.entity.InventoryStockMovement;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryStockMovementResponse(
        UUID id,
        UUID itemId,
        InventoryMovementType movementType,
        InventoryMovementDirection direction,
        BigDecimal quantity,
        BigDecimal balanceAfter,
        InventoryReferenceType referenceType,
        UUID referenceId,
        String remarks,
        UUID recordedByUserId,
        OffsetDateTime occurredAt,
        OffsetDateTime createdAt
) {
    public static InventoryStockMovementResponse from(
            InventoryStockMovement movement
    ) {
        return new InventoryStockMovementResponse(
                movement.getId(),
                movement.getItem().getId(),
                movement.getMovementType(),
                movement.getDirection(),
                movement.getQuantity(),
                movement.getBalanceAfter(),
                movement.getReferenceType(),
                movement.getReferenceId(),
                movement.getRemarks(),
                movement.getRecordedBy().getId(),
                movement.getOccurredAt(),
                movement.getCreatedAt()
        );
    }
}
