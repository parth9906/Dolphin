package com.school.dolphin.inventory.controller;

import com.school.dolphin.inventory.dto.CreateInventoryItemRequest;
import com.school.dolphin.inventory.dto.InventoryItemResponse;
import com.school.dolphin.inventory.dto.UpdateInventoryItemRequest;
import com.school.dolphin.inventory.entity.InventoryItemCategory;
import com.school.dolphin.inventory.service.InventoryItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/items")
@RequiredArgsConstructor
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @PostMapping
    @PreAuthorize("hasAuthority('INVENTORY_ITEM_CREATE')")
    public InventoryItemResponse create(
            @Valid @RequestBody CreateInventoryItemRequest request,
            Authentication authentication
    ) {
        return inventoryItemService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_ITEM_READ')")
    public Page<InventoryItemResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) InventoryItemCategory category,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "false") boolean lowStockOnly,
            @PageableDefault(size = 20, sort = "name") Pageable pageable,
            Authentication authentication
    ) {
        return inventoryItemService.search(
                institutionId,
                campusId,
                category,
                active,
                lowStockOnly,
                pageable,
                authentication);
    }

    @GetMapping("/{itemId}")
    @PreAuthorize("hasAuthority('INVENTORY_ITEM_READ')")
    public InventoryItemResponse getById(
            @PathVariable UUID itemId,
            Authentication authentication
    ) {
        return inventoryItemService.getById(itemId, authentication);
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAuthority('INVENTORY_ITEM_UPDATE')")
    public InventoryItemResponse update(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateInventoryItemRequest request,
            Authentication authentication
    ) {
        return inventoryItemService.update(itemId, request, authentication);
    }

    @PatchMapping("/{itemId}/deactivate")
    @PreAuthorize("hasAuthority('INVENTORY_ITEM_UPDATE')")
    public InventoryItemResponse deactivate(
            @PathVariable UUID itemId,
            Authentication authentication
    ) {
        return inventoryItemService.deactivate(itemId, authentication);
    }
}
