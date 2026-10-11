package com.school.dolphin.leave.repository;


import com.school.dolphin.leave.entity.StaffLeaveAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StaffLeaveAuditRepository
        extends JpaRepository<StaffLeaveAudit, UUID> {

    List<StaffLeaveAudit>
    findByLeaveRequest_IdOrderByChangedAtDesc(UUID leaveRequestId);
}
