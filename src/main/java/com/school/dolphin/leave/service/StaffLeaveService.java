package com.school.dolphin.leave.service;


import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.leave.dto.CreateStaffLeaveRequest;
import com.school.dolphin.leave.dto.ReviewStaffLeaveRequest;
import com.school.dolphin.leave.dto.StaffLeaveAuditResponse;
import com.school.dolphin.leave.dto.StaffLeaveResponse;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.entity.LeaveType;
import com.school.dolphin.leave.entity.StaffLeaveAudit;
import com.school.dolphin.leave.entity.StaffLeaveRequest;
import com.school.dolphin.leave.repository.LeaveTypeRepository;
import com.school.dolphin.leave.repository.StaffLeaveAuditRepository;
import com.school.dolphin.leave.repository.StaffLeaveRequestRepository;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffMember;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.entity.StaffLeaveAudit;
import com.school.dolphin.leave.entity.StaffLeaveRequest;
import com.school.dolphin.identity.entity.UserAccount;

@Service
@RequiredArgsConstructor
public class StaffLeaveService {

    private static final List<LeaveRequestStatus> OVERLAPPING_STATUSES =
            List.of(
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED
            );

    private final StaffLeaveRequestRepository staffLeaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final StaffLeaveAuditRepository staffLeaveAuditRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public StaffLeaveResponse create(
            CreateStaffLeaveRequest request,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, request.institutionId());

        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleViolationException(
                    "Leave end date cannot be before its start date");
        }

        boolean hasActiveAssignment =
                staffAssignmentRepository
                        .existsByStaffMember_IdAndInstitution_IdAndStatus(
                                request.staffMemberId(),
                                request.institutionId(),
                                StaffAssignmentStatus.ACTIVE);

        if (!hasActiveAssignment) {
            throw new BusinessRuleViolationException(
                    "Staff member must have an active assignment at this institution");
        }

        LeaveType leaveType = leaveTypeRepository.findById(request.leaveTypeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Leave type not found"));

        if (!leaveType.isActive()) {
            throw new BusinessRuleViolationException(
                    "This leave type is inactive");
        }

        boolean overlaps = staffLeaveRequestRepository
                .existsByStaffMember_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        request.staffMemberId(),
                        OVERLAPPING_STATUSES,
                        request.endDate(),
                        request.startDate());

        if (overlaps) {
            throw new DuplicateResourceException(
                    "This staff member already has a pending or approved "
                            + "leave request overlapping these dates");
        }

        StaffAssignment assignment = staffAssignmentRepository
                .findFirstByStaffMember_IdAndInstitution_IdAndStatus(
                        request.staffMemberId(),
                        request.institutionId(),
                        StaffAssignmentStatus.ACTIVE)
                .orElseThrow(() ->
                        new BusinessRuleViolationException(
                                "Staff member must have an active assignment at this institution"));

        StaffMember staffMember = assignment.getStaffMember();
        Institution institution = assignment.getInstitution();

        StaffLeaveRequest leave = new StaffLeaveRequest();
        leave.setStaffMember(staffMember);
        leave.setInstitution(institution);
        leave.setLeaveType(leaveType);
        leave.setStartDate(request.startDate());
        leave.setEndDate(request.endDate());
        leave.setReason(normalize(request.reason()));
        leave.setStatus(LeaveRequestStatus.PENDING);

        StaffLeaveRequest saved = staffLeaveRequestRepository.save(leave);

        UserAccount actor = getAuthenticatedUser(authentication);
        staffLeaveAuditRepository.save(new StaffLeaveAudit(
                saved, null, LeaveRequestStatus.PENDING, actor, null));

        return toResponse(saved);
    }

    @Transactional
    public StaffLeaveResponse approve(
            UUID leaveId,
            ReviewStaffLeaveRequest request,
            Authentication authentication
    ) {
        return review(
                leaveId, LeaveRequestStatus.APPROVED,
                request.comment(), authentication);
    }

    @Transactional
    public StaffLeaveResponse reject(
            UUID leaveId,
            ReviewStaffLeaveRequest request,
            Authentication authentication
    ) {
        return review(
                leaveId, LeaveRequestStatus.REJECTED,
                request.comment(), authentication);
    }

    private StaffLeaveResponse review(
            UUID leaveId,
            LeaveRequestStatus newStatus,
            String comment,
            Authentication authentication
    ) {
        StaffLeaveRequest leave = staffLeaveRequestRepository.findById(leaveId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Leave request not found"));

        requireInstitutionAccess(
                authentication, leave.getInstitution().getId());

        if (leave.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessRuleViolationException(
                    "Only pending leave requests can be reviewed");
        }

        if (newStatus != LeaveRequestStatus.APPROVED
                && newStatus != LeaveRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Unsupported review decision");
        }

        UserAccount reviewer = getAuthenticatedUser(authentication);
        LeaveRequestStatus previousStatus = leave.getStatus();

        leave.setStatus(newStatus);
        leave.setReviewedBy(reviewer);
        leave.setReviewedAt(OffsetDateTime.now());
        leave.setDecisionComment(normalize(comment));

        StaffLeaveRequest saved = staffLeaveRequestRepository.save(leave);

        staffLeaveAuditRepository.save(new StaffLeaveAudit(
                saved, previousStatus, newStatus,
                reviewer, normalize(comment)));

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<StaffLeaveResponse> list(
            UUID institutionId,
            LeaveRequestStatus status,
            Pageable pageable,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        if (pageable.getPageSize() > 100) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed 100");
        }

        return staffLeaveRequestRepository
                .findByInstitution_IdAndStatusOrderByStartDateAsc(
                        institutionId, status, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<StaffLeaveAuditResponse> getAudit(
            UUID leaveId,
            Authentication authentication
    ) {
        StaffLeaveRequest leave = staffLeaveRequestRepository.findById(leaveId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Leave request not found"));

        requireInstitutionAccess(
                authentication, leave.getInstitution().getId());

        return staffLeaveAuditRepository
                .findByLeaveRequest_IdOrderByChangedAtDesc(leaveId)
                .stream()
                .map(audit -> new StaffLeaveAuditResponse(
                        audit.getId(),
                        audit.getPreviousStatus(),
                        audit.getNewStatus(),
                        audit.getChangedBy().getId(),
                        audit.getComment(),
                        audit.getChangedAt()
                ))
                .toList();
    }
    
    @Transactional
    public StaffLeaveResponse cancel(
            UUID leaveRequestId,
            Authentication authentication) {

        StaffLeaveRequest leaveRequest = staffLeaveRequestRepository
                .findById(leaveRequestId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff leave request not found"));

        requireInstitutionAccess(
                authentication,
                leaveRequest.getInstitution().getId());

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessRuleViolationException(
                    "Only pending leave requests can be cancelled");
        }

        UserAccount currentUser = getAuthenticatedUser(authentication);

        LeaveRequestStatus previousStatus = leaveRequest.getStatus();

        leaveRequest.setStatus(LeaveRequestStatus.CANCELLED);

        StaffLeaveRequest savedRequest =
                staffLeaveRequestRepository.save(leaveRequest);

        StaffLeaveAudit audit = new StaffLeaveAudit(
                savedRequest,
                previousStatus,
                LeaveRequestStatus.CANCELLED,
                currentUser,
                "Leave request cancelled by requester or authorized administrator"
        );

        staffLeaveAuditRepository.save(audit);

        return toResponse(savedRequest);
    }


    private StaffLeaveResponse toResponse(StaffLeaveRequest leave) {
        return new StaffLeaveResponse(
                leave.getId(),
                leave.getStaffMember().getId(),
                leave.getInstitution().getId(),
                leave.getLeaveType().getId(),
                leave.getLeaveType().getCode(),
                leave.getLeaveType().getName(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getReason(),
                leave.getStatus(),
                leave.getReviewedBy() == null
                        ? null : leave.getReviewedBy().getId(),
                leave.getReviewedAt(),
                leave.getDecisionComment(),
                leave.getCreatedAt()
        );
    }

    private UserAccount getAuthenticatedUser(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authenticated user is unavailable");
        }

        return userAccountRepository.findById(principal.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User account not found"));
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
