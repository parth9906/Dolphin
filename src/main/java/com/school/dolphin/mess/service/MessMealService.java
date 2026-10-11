package com.school.dolphin.mess.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.inventory.entity.InventoryItem;
import com.school.dolphin.inventory.entity.InventoryReferenceType;
import com.school.dolphin.inventory.repository.InventoryItemRepository;
import com.school.dolphin.inventory.repository.InventoryStockMovementRepository;
import com.school.dolphin.inventory.service.InventoryStockService;
import com.school.dolphin.mess.dto.CreateMessMealRequest;
import com.school.dolphin.mess.dto.MessConsumptionRequest;
import com.school.dolphin.mess.dto.MessConsumptionResponse;
import com.school.dolphin.mess.dto.MessMealResponse;
import com.school.dolphin.mess.dto.MessMealSummaryResponse;
import com.school.dolphin.mess.entity.MessMealRecord;
import com.school.dolphin.mess.repository.MessMealRecordRepository;
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
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessMealService {

    private static final int MAX_PAGE_SIZE = 100;

    private final MessMealRecordRepository messMealRecordRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryStockMovementRepository
            inventoryStockMovementRepository;
    private final InventoryStockService inventoryStockService;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public MessMealResponse create(
            CreateMessMealRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot record a meal for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId());

        UserAccount recorder =
                authenticatedUserResolver.requireUserAccount(authentication);

        Map<UUID, BigDecimal> consumptionByItem = mergeConsumptions(
                request.consumptions());

        MessMealRecord meal = messMealRecordRepository.save(
                MessMealRecord.builder()
                        .institution(institution)
                        .campus(campus)
                        .mealType(request.mealType())
                        .servedOn(request.servedOn())
                        .headcount(request.headcount())
                        .notes(normalize(request.notes()))
                        .recordedBy(recorder)
                        .build());

        String remarks = "Mess " + request.mealType()
                + " on " + request.servedOn();

        consumptionByItem.forEach((itemId, quantity) -> {
            InventoryItem item = requireConsumableItem(
                    itemId, institution.getId());

            inventoryStockService.applyIssue(
                    item,
                    quantity,
                    InventoryReferenceType.MESS_MEAL,
                    meal.getId(),
                    remarks,
                    null,
                    recorder);
        });

        return MessMealResponse.from(meal, loadConsumptions(meal.getId()));
    }

    @Transactional(readOnly = true)
    public MessMealResponse getById(
            UUID mealId,
            Authentication authentication
    ) {
        MessMealRecord meal = requireMeal(mealId);

        requireInstitutionAccess(
                authentication, meal.getInstitution().getId());

        return MessMealResponse.from(meal, loadConsumptions(mealId));
    }

    @Transactional(readOnly = true)
    public Page<MessMealSummaryResponse> search(
            UUID institutionId,
            UUID campusId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessRuleViolationException(
                    "fromDate must not be after toDate");
        }

        requireInstitutionAccess(authentication, institutionId);

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return messMealRecordRepository
                .search(
                        institutionId,
                        campusId,
                        fromDate,
                        toDate,
                        pageable)
                .map(MessMealSummaryResponse::from);
    }

    private Map<UUID, BigDecimal> mergeConsumptions(
            List<MessConsumptionRequest> consumptions
    ) {
        Map<UUID, BigDecimal> merged = new LinkedHashMap<>();

        for (MessConsumptionRequest consumption : consumptions) {
            merged.merge(
                    consumption.itemId(),
                    consumption.quantity(),
                    BigDecimal::add);
        }

        return merged;
    }

    private List<MessConsumptionResponse> loadConsumptions(UUID mealId) {
        return inventoryStockMovementRepository
                .findByReference(
                        InventoryReferenceType.MESS_MEAL, mealId)
                .stream()
                .map(movement -> {
                    InventoryItem item = movement.getItem();

                    return new MessConsumptionResponse(
                            item.getId(),
                            item.getCode(),
                            item.getName(),
                            item.getUnit(),
                            movement.getQuantity());
                })
                .toList();
    }

    private InventoryItem requireConsumableItem(
            UUID itemId,
            UUID institutionId
    ) {
        InventoryItem item = inventoryItemRepository
                .findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Inventory item not found"));

        if (!item.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Inventory item does not belong to the requested "
                            + "institution");
        }

        if (!item.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot consume an inactive inventory item");
        }

        return item;
    }

    private MessMealRecord requireMeal(UUID mealId) {
        return messMealRecordRepository
                .findById(mealId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mess meal not found"));
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
                    "Cannot record a meal for an inactive campus");
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
}
