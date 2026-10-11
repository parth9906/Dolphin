
package com.school.dolphin.attendance.repository;

import com.school.dolphin.attendance.entity.AttendanceAlert;
import com.school.dolphin.attendance.entity.AttendanceAlertAudit;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceAlertAuditRepository
        extends JpaRepository<AttendanceAlertAudit, UUID> {

    List<AttendanceAlertAudit>
    findByAttendanceAlert_IdOrderByChangedAtDesc(UUID alertId);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AttendanceAlert a WHERE a.id = :alertId")
    Optional<AttendanceAlert> findByIdForUpdate(
            @Param("alertId") UUID alertId
    );

}
