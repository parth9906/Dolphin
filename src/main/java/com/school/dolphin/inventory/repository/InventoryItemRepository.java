package com.school.dolphin.inventory.repository;

import com.school.dolphin.inventory.entity.InventoryItem;
import com.school.dolphin.inventory.entity.InventoryItemCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, UUID> {

    boolean existsByInstitution_IdAndCodeIgnoreCase(
            UUID institutionId,
            String code
    );

    @Query("""
        SELECT i
        FROM InventoryItem i
        JOIN FETCH i.institution
        JOIN FETCH i.createdBy
        LEFT JOIN FETCH i.campus
        WHERE i.institution.id = :institutionId
          AND (:campusId IS NULL OR i.campus.id = :campusId)
          AND (:category IS NULL OR i.category = :category)
          AND (:active IS NULL OR i.active = :active)
          AND (:lowStockOnly = false
               OR (i.reorderLevel > 0 AND i.quantityOnHand <= i.reorderLevel)
          )
        """)
    Page<InventoryItem> search(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("category") InventoryItemCategory category,
            @Param("active") Boolean active,
            @Param("lowStockOnly") boolean lowStockOnly,
            Pageable pageable
    );
}
