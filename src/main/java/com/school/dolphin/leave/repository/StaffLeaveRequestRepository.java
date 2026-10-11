package com.school.dolphin.leave.repository;


import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.entity.StaffLeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StaffLeaveRequestRepository
        extends JpaRepository<StaffLeaveRequest, UUID> {

    Page<StaffLeaveRequest>
    findByInstitution_IdAndStatusOrderByStartDateAsc(
            UUID institutionId,
            LeaveRequestStatus status,
            Pageable pageable
    );

    List<StaffLeaveRequest>
    findByStaffMember_IdOrderByCreatedAtDesc(UUID staffMemberId);

    boolean existsByStaffMember_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            UUID staffMemberId,
            Collection<LeaveRequestStatus> statuses,
            LocalDate endDate,
            LocalDate startDate
    );

    boolean existsByStaffMember_IdAndInstitution_IdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            UUID staffMemberId,
            UUID institutionId,
            LeaveRequestStatus status,
            LocalDate endDate,
            LocalDate startDate);
}
