package com.school.dolphin.mess.repository;

import com.school.dolphin.mess.entity.MessMealRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface MessMealRecordRepository
        extends JpaRepository<MessMealRecord, UUID> {

    @Query("""
        SELECT m
        FROM MessMealRecord m
        JOIN FETCH m.institution
        JOIN FETCH m.recordedBy
        LEFT JOIN FETCH m.campus
        WHERE m.institution.id = :institutionId
          AND (:campusId IS NULL OR m.campus.id = :campusId)
          AND (:fromDate IS NULL OR m.servedOn >= :fromDate)
          AND (:toDate IS NULL OR m.servedOn <= :toDate)
        """)
    Page<MessMealRecord> search(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
