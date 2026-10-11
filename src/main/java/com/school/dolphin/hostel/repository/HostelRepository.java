package com.school.dolphin.hostel.repository;

import com.school.dolphin.hostel.entity.Hostel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface HostelRepository extends JpaRepository<Hostel, UUID> {

    boolean existsByInstitution_IdAndCodeIgnoreCase(
            UUID institutionId,
            String code
    );

    @Query("""
        SELECT h
        FROM Hostel h
        JOIN FETCH h.institution
        JOIN FETCH h.createdBy
        LEFT JOIN FETCH h.campus
        WHERE h.institution.id = :institutionId
          AND (:campusId IS NULL OR h.campus.id = :campusId)
          AND (:active IS NULL OR h.active = :active)
        """)
    Page<Hostel> search(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
