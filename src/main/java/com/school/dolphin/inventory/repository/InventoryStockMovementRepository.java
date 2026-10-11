package com.school.dolphin.inventory.repository;

import com.school.dolphin.inventory.entity.InventoryMovementType;
import com.school.dolphin.inventory.entity.InventoryReferenceType;
import com.school.dolphin.inventory.entity.InventoryStockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InventoryStockMovementRepository
        extends JpaRepository<InventoryStockMovement, UUID> {

    @Query("""
        SELECT m
        FROM InventoryStockMovement m
        JOIN FETCH m.item
        JOIN FETCH m.recordedBy
        WHERE m.item.id = :itemId
          AND (:movementType IS NULL OR m.movementType = :movementType)
        """)
    Page<InventoryStockMovement> searchByItem(
            @Param("itemId") UUID itemId,
            @Param("movementType") InventoryMovementType movementType,
            Pageable pageable
    );

    @Query("""
        SELECT m
        FROM InventoryStockMovement m
        JOIN FETCH m.item
        WHERE m.referenceType = :referenceType
          AND m.referenceId = :referenceId
        ORDER BY m.occurredAt ASC
        """)
    List<InventoryStockMovement> findByReference(
            @Param("referenceType") InventoryReferenceType referenceType,
            @Param("referenceId") UUID referenceId
    );
}
