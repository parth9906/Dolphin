package com.school.dolphin.calendar.repository;

import com.school.dolphin.calendar.entity.CalendarEvent;
import com.school.dolphin.calendar.entity.CalendarEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventRepository
        extends JpaRepository<CalendarEvent, UUID> {

    Optional<CalendarEvent> findByIdAndActiveTrue(UUID id);

    /**
     * Returns active events overlapping the requested window. A campus filter
     * also returns institution-wide events (those without a campus), because
     * institution-wide events such as holidays apply to every campus.
     */
    @Query("""
        SELECT e
        FROM CalendarEvent e
        LEFT JOIN e.campus c
        WHERE e.institution.id = :institutionId
          AND e.active = true
          AND (
              :campusId IS NULL
              OR c.id = :campusId
              OR e.campus IS NULL
          )
          AND (:eventType IS NULL OR e.eventType = :eventType)
          AND (:fromDate IS NULL OR e.endDate >= :fromDate)
          AND (:toDate IS NULL OR e.startDate <= :toDate)
        """)
    Page<CalendarEvent> search(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("eventType") CalendarEventType eventType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
