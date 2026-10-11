package com.school.dolphin.leave.entity;


import com.school.dolphin.identity.entity.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "staff_leave_audit")
@Getter
@NoArgsConstructor
public class StaffLeaveAudit {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "leave_request_id", nullable = false)
    private StaffLeaveRequest leaveRequest;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LeaveRequestStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveRequestStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private UserAccount changedBy;

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime changedAt;

    public StaffLeaveAudit(
            StaffLeaveRequest leaveRequest,
            LeaveRequestStatus previousStatus,
            LeaveRequestStatus newStatus,
            UserAccount changedBy,
            String comment
    ) {
        this.id = UUID.randomUUID();
        this.leaveRequest = leaveRequest;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.comment = comment;
        this.changedAt = OffsetDateTime.now();
    }
}
