package com.school.dolphin.inventory.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.inventory.dto.AdjustStockRequest;
import com.school.dolphin.inventory.dto.InventoryStockMovementResponse;
import com.school.dolphin.inventory.dto.RecordStockMovementRequest;
import com.school.dolphin.inventory.entity.InventoryItem;
import com.school.dolphin.inventory.entity.InventoryMovementDirection;
import com.school.dolphin.inventory.entity.InventoryMovementType;
import com.school.dolphin.inventory.entity.InventoryReferenceType;
import com.school.dolphin.inventory.entity.InventoryStockMovement;
import com.school.dolphin.inventory.repository.InventoryItemRepository;
import com.school.dolphin.inventory.repository.InventoryStockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryStockService {

    private static final int MAX_PAGE_SIZE = 100;

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryStockMovementRepository
            inventoryStockMovementRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public InventoryStockMovementResponse recordReceipt(
            UUID itemId,
            RecordStockMovementRequest request,
            Authentication authentication
    ) {
        InventoryItem item = requireActiveItem(itemId);
        requireInstitutionAccess(authentication, item.getInstitution().getId());
        requireNotFuture(request.occurredAt());

        UserAccount actor =
                authenticatedUserResolver.requireUserAccount(authentication);

        InventoryStockMovement movement = applyReceipt(
                item,
                request.quantity(),
                requireClientReferenceType(request.referenceType()),
                request.referenceId(),
                normalize(request.remarks()),
                request.occurredAt(),
                actor);

        return InventoryStockMovementResponse.from(movement);
    }

    @Transactional
    public InventoryStockMovementResponse recordIssue(
            UUID itemId,
            RecordStockMovementRequest request,
            Authentication authentication
    ) {
        InventoryItem item = requireActiveItem(itemId);
        requireInstitutionAccess(authentication, item.getInstitution().getId());
        requireNotFuture(request.occurredAt());

        UserAccount actor =
                authenticatedUserResolver.requireUserAccount(authentication);

        InventoryStockMovement movement = applyIssue(
                item,
                request.quantity(),
                requireClientReferenceType(request.referenceType()),
                request.referenceId(),
                normalize(request.remarks()),
                request.occurredAt(),
                actor);

        return InventoryStockMovementResponse.from(movement);
    }

    @Transactional
    public InventoryStockMovementResponse recordWastage(
            UUID itemId,
            RecordStockMovementRequest request,
            Authentication authentication
    ) {
        InventoryItem item = requireActiveItem(itemId);
        requireInstitutionAccess(authentication, item.getInstitution().getId());
        requireNotFuture(request.occurredAt());

        UserAccount actor =
                authenticatedUserResolver.requireUserAccount(authentication);

        InventoryStockMovement movement = applyWastage(
                item,
                request.quantity(),
                requireClientReferenceType(request.referenceType()),
                request.referenceId(),
                normalize(request.remarks()),
                request.occurredAt(),
                actor);

        return InventoryStockMovementResponse.from(movement);
    }

    @Transactional
    public InventoryStockMovementResponse recordAdjustment(
            UUID itemId,
            AdjustStockRequest request,
            Authentication authentication
    ) {
        InventoryItem item = requireActiveItem(itemId);
        requireInstitutionAccess(authentication, item.getInstitution().getId());
        requireNotFuture(request.occurredAt());

        UserAccount actor =
                authenticatedUserResolver.requireUserAccount(authentication);

        InventoryStockMovement movement = applyAdjustment(
                item,
                request.direction(),
                request.quantity(),
                requireClientReferenceType(request.referenceType()),
                request.referenceId(),
                normalize(request.remarks()),
                request.occurredAt(),
                actor);

        return InventoryStockMovementResponse.from(movement);
    }

    @Transactional(readOnly = true)
    public Page<InventoryStockMovementResponse> listMovements(
            UUID itemId,
            InventoryMovementType movementType,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        InventoryItem item = requireItem(itemId);
        requireInstitutionAccess(authentication, item.getInstitution().getId());

        return inventoryStockMovementRepository
                .searchByItem(itemId, movementType, pageable)
                .map(InventoryStockMovementResponse::from);
    }

    /**
     * Ledger primitive for other modules (for example the mess/canteen meal
     * service). Authorization and institution scoping are the caller's
     * responsibility; this method only enforces stock and type invariants.
     */
    @Transactional
    public InventoryStockMovement applyReceipt(
            InventoryItem item,
            BigDecimal quantity,
            InventoryReferenceType referenceType,
            UUID referenceId,
            String remarks,
            OffsetDateTime occurredAt,
            UserAccount actor
    ) {
        return applyMovement(
                item,
                InventoryMovementType.RECEIPT,
                InventoryMovementDirection.IN,
                quantity,
                referenceType,
                referenceId,
                remarks,
                occurredAt,
                actor);
    }

    @Transactional
    public InventoryStockMovement applyIssue(
            InventoryItem item,
            BigDecimal quantity,
            InventoryReferenceType referenceType,
            UUID referenceId,
            String remarks,
            OffsetDateTime occurredAt,
            UserAccount actor
    ) {
        return applyMovement(
                item,
                InventoryMovementType.ISSUE,
                InventoryMovementDirection.OUT,
                quantity,
                referenceType,
                referenceId,
                remarks,
                occurredAt,
                actor);
    }

    @Transactional
    public InventoryStockMovement applyWastage(
            InventoryItem item,
            BigDecimal quantity,
            InventoryReferenceType referenceType,
            UUID referenceId,
            String remarks,
            OffsetDateTime occurredAt,
            UserAccount actor
    ) {
        return applyMovement(
                item,
                InventoryMovementType.WASTAGE,
                InventoryMovementDirection.OUT,
                quantity,
                referenceType,
                referenceId,
                remarks,
                occurredAt,
                actor);
    }

    @Transactional
    public InventoryStockMovement applyAdjustment(
            InventoryItem item,
            InventoryMovementDirection direction,
            BigDecimal quantity,
            InventoryReferenceType referenceType,
            UUID referenceId,
            String remarks,
            OffsetDateTime occurredAt,
            UserAccount actor
    ) {
        return applyMovement(
                item,
                InventoryMovementType.ADJUSTMENT,
                direction,
                quantity,
                referenceType,
                referenceId,
                remarks,
                occurredAt,
                actor);
    }

    private InventoryStockMovement applyMovement(
            InventoryItem item,
            InventoryMovementType movementType,
            InventoryMovementDirection direction,
            BigDecimal quantity,
            InventoryReferenceType referenceType,
            UUID referenceId,
            String remarks,
            OffsetDateTime occurredAt,
            UserAccount actor
    ) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BusinessRuleViolationException(
                    "Stock movement quantity must be greater than zero");
        }

        BigDecimal current = item.getQuantityOnHand() == null
                ? BigDecimal.ZERO
                : item.getQuantityOnHand();

        BigDecimal delta = direction == InventoryMovementDirection.IN
                ? quantity
                : quantity.negate();

        BigDecimal balanceAfter = current.add(delta);

        if (balanceAfter.signum() < 0) {
            throw new BusinessRuleViolationException(
                    "Insufficient stock for item " + item.getCode()
                            + ": on hand " + current.stripTrailingZeros()
                            + ", requested " + quantity.stripTrailingZeros());
        }

        item.setQuantityOnHand(balanceAfter);
        inventoryItemRepository.save(item);

        InventoryStockMovement movement = InventoryStockMovement.builder()
                .item(item)
                .institution(item.getInstitution())
                .movementType(movementType)
                .direction(direction)
                .quantity(quantity)
                .balanceAfter(balanceAfter)
                .referenceType(referenceType == null
                        ? InventoryReferenceType.MANUAL : referenceType)
                .referenceId(referenceId)
                .remarks(remarks)
                .recordedBy(actor)
                .occurredAt(occurredAt)
                .build();

        return inventoryStockMovementRepository.save(movement);
    }

    private InventoryReferenceType requireClientReferenceType(
            InventoryReferenceType referenceType
    ) {
        if (referenceType == InventoryReferenceType.MESS_MEAL) {
            throw new BusinessRuleViolationException(
                    "Mess meal consumption must be recorded through the "
                            + "mess meal API");
        }

        return referenceType == null
                ? InventoryReferenceType.MANUAL
                : referenceType;
    }

    private InventoryItem requireItem(UUID itemId) {
        return inventoryItemRepository
                .findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory item not found"));
    }

    private InventoryItem requireActiveItem(UUID itemId) {
        InventoryItem item = requireItem(itemId);

        if (!item.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot record stock movements for an inactive "
                            + "inventory item");
        }

        return item;
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void requireNotFuture(OffsetDateTime occurredAt) {
        if (occurredAt != null
                && occurredAt.isAfter(OffsetDateTime.now())) {
            throw new BusinessRuleViolationException(
                    "Stock movement time cannot be in the future");
        }
    }
}
