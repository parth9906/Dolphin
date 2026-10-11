package com.school.dolphin.inventory.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.inventory.dto.CreateInventoryItemRequest;
import com.school.dolphin.inventory.dto.InventoryItemResponse;
import com.school.dolphin.inventory.dto.UpdateInventoryItemRequest;
import com.school.dolphin.inventory.entity.InventoryItem;
import com.school.dolphin.inventory.entity.InventoryItemCategory;
import com.school.dolphin.inventory.repository.InventoryItemRepository;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryItemService {

    private static final int MAX_PAGE_SIZE = 100;

    private final InventoryItemRepository inventoryItemRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public InventoryItemResponse create(
            CreateInventoryItemRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create inventory for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId());

        String code = request.code().trim();

        if (inventoryItemRepository
                .existsByInstitution_IdAndCodeIgnoreCase(
                        institution.getId(), code)) {
            throw new DuplicateResourceException(
                    "An inventory item with this code already exists");
        }

        UserAccount creator =
                authenticatedUserResolver.requireUserAccount(authentication);

        InventoryItem item = InventoryItem.builder()
                .institution(institution)
                .campus(campus)
                .code(code)
                .name(request.name().trim())
                .category(request.category())
                .unit(request.unit())
                .quantityOnHand(BigDecimal.ZERO)
                .reorderLevel(request.reorderLevel())
                .active(true)
                .createdBy(creator)
                .build();

        return InventoryItemResponse.from(
                inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse update(
            UUID itemId,
            UpdateInventoryItemRequest request,
            Authentication authentication
    ) {
        InventoryItem item = requireItem(itemId);

        requireInstitutionAccess(
                authentication, item.getInstitution().getId());

        if (!item.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot update an inactive inventory item");
        }

        ensureVersion(item, request.version());

        if (item.getUnit() != request.unit()
                && item.getQuantityOnHand().signum() > 0) {
            throw new BusinessRuleViolationException(
                    "Cannot change the unit of measure while stock is on hand");
        }

        item.setName(request.name().trim());
        item.setCategory(request.category());
        item.setUnit(request.unit());
        item.setReorderLevel(request.reorderLevel());

        return InventoryItemResponse.from(
                inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse deactivate(
            UUID itemId,
            Authentication authentication
    ) {
        InventoryItem item = requireItem(itemId);

        requireInstitutionAccess(
                authentication, item.getInstitution().getId());

        if (!item.isActive()) {
            throw new BusinessRuleViolationException(
                    "Inventory item is already inactive");
        }

        if (item.getQuantityOnHand() != null
                && item.getQuantityOnHand().signum() > 0) {
            throw new BusinessRuleViolationException(
                    "Cannot deactivate an inventory item while stock is on "
                            + "hand; issue or write off the remaining stock "
                            + "first");
        }

        item.setActive(false);

        return InventoryItemResponse.from(
                inventoryItemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getById(
            UUID itemId,
            Authentication authentication
    ) {
        InventoryItem item = requireItem(itemId);

        requireInstitutionAccess(
                authentication, item.getInstitution().getId());

        return InventoryItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public Page<InventoryItemResponse> search(
            UUID institutionId,
            UUID campusId,
            InventoryItemCategory category,
            Boolean active,
            boolean lowStockOnly,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        requireInstitutionAccess(authentication, institutionId);

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return inventoryItemRepository
                .search(
                        institutionId,
                        campusId,
                        category,
                        active,
                        lowStockOnly,
                        pageable)
                .map(InventoryItemResponse::from);
    }

    private InventoryItem requireItem(UUID itemId) {
        return inventoryItemRepository
                .findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory item not found"));
    }

    private Campus resolveCampus(
            UUID campusId,
            UUID institutionId
    ) {
        if (campusId == null) {
            return null;
        }

        Campus campus = requireCampusInInstitution(campusId, institutionId);

        if (!campus.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create inventory for an inactive campus");
        }

        return campus;
    }

    private Campus requireCampusInInstitution(
            UUID campusId,
            UUID institutionId
    ) {
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Campus not found"));

        if (!campus.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Campus does not belong to the requested institution");
        }

        return campus;
    }

    private void ensureVersion(InventoryItem item, Long version) {
        if (version == null || !version.equals(item.getVersion())) {
            throw new StaleResourceVersionException(
                    "The inventory item was modified by another request. "
                            + "Reload it and try again.");
        }
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
}
