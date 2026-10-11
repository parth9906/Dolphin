package com.school.dolphin.inventory.controller;

import com.school.dolphin.inventory.dto.AdjustStockRequest;
import com.school.dolphin.inventory.dto.InventoryStockMovementResponse;
import com.school.dolphin.inventory.dto.RecordStockMovementRequest;
import com.school.dolphin.inventory.entity.InventoryMovementType;
import com.school.dolphin.inventory.service.InventoryStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/items/{itemId}")
@RequiredArgsConstructor
public class InventoryStockController {

    private final InventoryStockService inventoryStockService;

    @PostMapping("/receipts")
    @PreAuthorize("hasAuthority('INVENTORY_STOCK_RECEIVE')")
    public InventoryStockMovementResponse recordReceipt(
            @PathVariable UUID itemId,
            @Valid @RequestBody RecordStockMovementRequest request,
            Authentication authentication
    ) {
        return inventoryStockService.recordReceipt(
                itemId, request, authentication);
    }

    @PostMapping("/issues")
    @PreAuthorize("hasAuthority('INVENTORY_STOCK_ISSUE')")
    public InventoryStockMovementResponse recordIssue(
            @PathVariable UUID itemId,
            @Valid @RequestBody RecordStockMovementRequest request,
            Authentication authentication
    ) {
        return inventoryStockService.recordIssue(
                itemId, request, authentication);
    }

    @PostMapping("/wastage")
    @PreAuthorize("hasAuthority('INVENTORY_STOCK_ISSUE')")
    public InventoryStockMovementResponse recordWastage(
            @PathVariable UUID itemId,
            @Valid @RequestBody RecordStockMovementRequest request,
            Authentication authentication
    ) {
        return inventoryStockService.recordWastage(
                itemId, request, authentication);
    }

    @PostMapping("/adjustments")
    @PreAuthorize("hasAuthority('INVENTORY_STOCK_ADJUST')")
    public InventoryStockMovementResponse recordAdjustment(
            @PathVariable UUID itemId,
            @Valid @RequestBody AdjustStockRequest request,
            Authentication authentication
    ) {
        return inventoryStockService.recordAdjustment(
                itemId, request, authentication);
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('INVENTORY_STOCK_READ')")
    public Page<InventoryStockMovementResponse> movements(
            @PathVariable UUID itemId,
            @RequestParam(required = false) InventoryMovementType movementType,
            @PageableDefault(
                    size = 20,
                    sort = "occurredAt",
                    direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication
    ) {
        return inventoryStockService.listMovements(
                itemId, movementType, pageable, authentication);
    }
}
