package com.school.dolphin.leave.repository;

import com.school.dolphin.leave.entity.StudentLeaveAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentLeaveAuditRepository
        extends JpaRepository<StudentLeaveAudit, UUID> {

    List<StudentLeaveAudit> findByLeaveRequest_IdOrderByChangedAtDesc(
            UUID leaveRequestId
    );
}
