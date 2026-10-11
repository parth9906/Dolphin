package com.school.dolphin.hostel.repository;

import com.school.dolphin.hostel.entity.HostelRoom;
import com.school.dolphin.hostel.entity.HostelRoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface HostelRoomRepository
        extends JpaRepository<HostelRoom, UUID> {

    boolean existsByHostel_IdAndRoomNumberIgnoreCase(
            UUID hostelId,
            String roomNumber
    );

    Optional<HostelRoom> findByIdAndHostel_Id(
            UUID roomId,
            UUID hostelId
    );

    @Query("""
        SELECT r
        FROM HostelRoom r
        JOIN FETCH r.hostel
        WHERE r.hostel.id = :hostelId
          AND (:roomType IS NULL OR r.roomType = :roomType)
          AND (:active IS NULL OR r.active = :active)
        """)
    Page<HostelRoom> search(
            @Param("hostelId") UUID hostelId,
            @Param("roomType") HostelRoomType roomType,
            @Param("active") Boolean active,
            Pageable pageable
    );

    /**
     * Locks the room row so concurrent allocations for the same room are
     * serialized while the capacity check runs.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM HostelRoom r
        JOIN FETCH r.hostel h
        JOIN FETCH h.institution
        WHERE r.id = :roomId
        """)
    Optional<HostelRoom> findByIdForUpdate(@Param("roomId") UUID roomId);
}
