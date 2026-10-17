package com.school.dolphin.leave.controller;

import com.school.dolphin.leave.dto.CreateStaffLeaveRequest;
import com.school.dolphin.leave.dto.LeaveTypeResponse;
import com.school.dolphin.leave.dto.ReviewStaffLeaveRequest;
import com.school.dolphin.leave.dto.StaffLeaveAuditResponse;
import com.school.dolphin.leave.dto.StaffLeaveResponse;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.service.LeaveTypeService;
import com.school.dolphin.leave.service.StaffLeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff-leave")
@RequiredArgsConstructor
public class StaffLeaveController {

    private final StaffLeaveService staffLeaveService;
    private final LeaveTypeService leaveTypeService;

    @PostMapping
    @PreAuthorize("hasAuthority('STAFF_LEAVE_CREATE')")
    public StaffLeaveResponse create(
            @Valid @RequestBody CreateStaffLeaveRequest request,
            Authentication authentication
    ) {
        return staffLeaveService.create(request, authentication);
    }

    @GetMapping("/types")
    @PreAuthorize("hasAuthority('STAFF_LEAVE_READ')")
    public List<LeaveTypeResponse> getLeaveTypes(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return leaveTypeService.getStaffLeaveTypes(
                institutionId,
                authentication
        );
    }

    @GetMapping
    @PreAuthorize("hasAuthority('STAFF_LEAVE_READ')")
    public Page<StaffLeaveResponse> list(
            @RequestParam UUID institutionId,
            @RequestParam LeaveRequestStatus status,
            @PageableDefault(size = 20, sort = "startDate")
            Pageable pageable,
            Authentication authentication
    ) {
        return staffLeaveService.list(
                institutionId,
                status,
                pageable,
                authentication
        );
    }

    @PostMapping("/{leaveId}/approve")
    @PreAuthorize("hasAuthority('STAFF_LEAVE_REVIEW')")
    public StaffLeaveResponse approve(
            @PathVariable UUID leaveId,
            @Valid @RequestBody ReviewStaffLeaveRequest request,
            Authentication authentication
    ) {
        return staffLeaveService.approve(
                leaveId,
                request,
                authentication
        );
    }

    @PostMapping("/{leaveId}/reject")
    @PreAuthorize("hasAuthority('STAFF_LEAVE_REVIEW')")
    public StaffLeaveResponse reject(
            @PathVariable UUID leaveId,
            @Valid @RequestBody ReviewStaffLeaveRequest request,
            Authentication authentication
    ) {
        return staffLeaveService.reject(
                leaveId,
                request,
                authentication
        );
    }

    @GetMapping("/{leaveId}/audit")
    @PreAuthorize("hasAuthority('STAFF_LEAVE_AUDIT_READ')")
    public List<StaffLeaveAuditResponse> getAudit(
            @PathVariable UUID leaveId,
            Authentication authentication
    ) {
        return staffLeaveService.getAudit(
                leaveId,
                authentication
        );
    }

    @PostMapping("/{leaveRequestId}/cancel")
    @PreAuthorize("hasAuthority('STAFF_LEAVE_CANCEL')")
    public StaffLeaveResponse cancel(
            @PathVariable UUID leaveRequestId,
            Authentication authentication
    ) {
        return staffLeaveService.cancel(
                leaveRequestId,
                authentication
        );
    }
}