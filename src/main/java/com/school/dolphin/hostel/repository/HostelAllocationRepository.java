package com.school.dolphin.hostel.repository;

import com.school.dolphin.hostel.entity.HostelAllocation;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface HostelAllocationRepository
        extends JpaRepository<HostelAllocation, UUID> {

    Optional<HostelAllocation> findByIdAndRoom_Hostel_Id(
            UUID allocationId,
            UUID hostelId
    );

    Optional<HostelAllocation> findFirstByStudent_IdAndStatus(
            UUID studentId,
            HostelAllocationStatus status
    );

    long countByRoom_IdAndStatus(UUID roomId, HostelAllocationStatus status);

    @Query("""
        SELECT a.room.id AS roomId, COUNT(a) AS occupied
        FROM HostelAllocation a
        WHERE a.room.id IN :roomIds
          AND a.status = :status
        GROUP BY a.room.id
        """)
    List<RoomOccupancyProjection> countByRoomIdsAndStatus(
            @Param("roomIds") Collection<UUID> roomIds,
            @Param("status") HostelAllocationStatus status
    );

    @Query("""
        SELECT a
        FROM HostelAllocation a
        JOIN FETCH a.student s
        JOIN FETCH a.room r
        JOIN FETCH r.hostel h
        WHERE h.id = :hostelId
          AND (:roomId IS NULL OR r.id = :roomId)
          AND (:studentId IS NULL OR s.id = :studentId)
          AND (:status IS NULL OR a.status = :status)
        """)
    Page<HostelAllocation> search(
            @Param("hostelId") UUID hostelId,
            @Param("roomId") UUID roomId,
            @Param("studentId") UUID studentId,
            @Param("status") HostelAllocationStatus status,
            Pageable pageable
    );
}
