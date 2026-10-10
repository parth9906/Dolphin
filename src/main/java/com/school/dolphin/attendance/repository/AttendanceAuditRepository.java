
package com.school.dolphin.attendance.repository;

import com.school.dolphin.attendance.entity.AttendanceAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttendanceAuditRepository
        extends JpaRepository<AttendanceAudit, UUID> {

    List<AttendanceAudit>
    findByAttendanceRecord_IdOrderByChangedAtDesc(UUID attendanceRecordId);
}