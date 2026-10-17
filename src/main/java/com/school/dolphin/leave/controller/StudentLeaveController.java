package com.school.dolphin.leave.controller;

import com.school.dolphin.leave.dto.CreateStudentLeaveRequest;
import com.school.dolphin.leave.dto.LeaveTypeResponse;
import com.school.dolphin.leave.dto.ReviewStudentLeaveRequest;
import com.school.dolphin.leave.dto.StudentLeaveAuditResponse;
import com.school.dolphin.leave.dto.StudentLeaveResponse;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.service.LeaveTypeService;
import com.school.dolphin.leave.service.StudentLeaveService;
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
@RequestMapping("/api/v1/student-leave")
@RequiredArgsConstructor
public class StudentLeaveController {

    private final StudentLeaveService studentLeaveService;
    private final LeaveTypeService leaveTypeService;

    @PostMapping
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_CREATE')")
    public StudentLeaveResponse create(
            @Valid @RequestBody CreateStudentLeaveRequest request,
            Authentication authentication
    ) {
        return studentLeaveService.create(request, authentication);
    }

    @GetMapping("/types")
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_READ')")
    public List<LeaveTypeResponse> getLeaveTypes(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return leaveTypeService.getStudentLeaveTypes(
                institutionId,
                authentication
        );
    }

    @GetMapping
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_READ')")
    public Page<StudentLeaveResponse> list(
            @RequestParam UUID institutionId,
            @RequestParam LeaveRequestStatus status,
            @PageableDefault(size = 20, sort = "startDate")
            Pageable pageable,
            Authentication authentication
    ) {
        return studentLeaveService.list(
                institutionId,
                status,
                pageable,
                authentication
        );
    }

    @PostMapping("/{leaveId}/approve")
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_REVIEW')")
    public StudentLeaveResponse approve(
            @PathVariable UUID leaveId,
            @Valid @RequestBody ReviewStudentLeaveRequest request,
            Authentication authentication
    ) {
        return studentLeaveService.approve(
                leaveId,
                request,
                authentication
        );
    }

    @PostMapping("/{leaveId}/reject")
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_REVIEW')")
    public StudentLeaveResponse reject(
            @PathVariable UUID leaveId,
            @Valid @RequestBody ReviewStudentLeaveRequest request,
            Authentication authentication
    ) {
        return studentLeaveService.reject(
                leaveId,
                request,
                authentication
        );
    }

    @PostMapping("/{leaveRequestId}/cancel")
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_CANCEL')")
    public StudentLeaveResponse cancel(
            @PathVariable UUID leaveRequestId,
            Authentication authentication
    ) {
        return studentLeaveService.cancel(
                leaveRequestId,
                authentication
        );
    }

    @GetMapping("/{leaveId}/audit")
    @PreAuthorize("hasAuthority('STUDENT_LEAVE_AUDIT_READ')")
    public List<StudentLeaveAuditResponse> getAudit(
            @PathVariable UUID leaveId,
            Authentication authentication
    ) {
        return studentLeaveService.getAudit(
                leaveId,
                authentication
        );
    }
}