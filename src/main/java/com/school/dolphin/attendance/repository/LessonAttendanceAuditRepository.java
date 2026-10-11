package com.school.dolphin.attendance.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.school.dolphin.attendance.entity.LessonAttendanceAudit;

public interface LessonAttendanceAuditRepository
        extends JpaRepository<LessonAttendanceAudit, UUID> {

    List<LessonAttendanceAudit>
    findByAttendanceRecord_IdOrderByChangedAtDesc(UUID attendanceRecordId);
}