package com.school.dolphin.leave.service;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.repository.StudentEnrollmentRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.leave.dto.CreateStudentLeaveRequest;
import com.school.dolphin.leave.dto.ReviewStudentLeaveRequest;
import com.school.dolphin.leave.dto.StudentLeaveAuditResponse;
import com.school.dolphin.leave.dto.StudentLeaveResponse;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.entity.LeaveType;
import com.school.dolphin.leave.entity.StudentLeaveAudit;
import com.school.dolphin.leave.entity.StudentLeaveRequest;
import com.school.dolphin.leave.repository.LeaveTypeRepository;
import com.school.dolphin.leave.repository.StudentLeaveAuditRepository;
import com.school.dolphin.leave.repository.StudentLeaveRequestRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
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

@Service
@RequiredArgsConstructor
public class StudentLeaveService {

    private static final List<LeaveRequestStatus> OVERLAPPING_STATUSES =
            List.of(
                    LeaveRequestStatus.PENDING,
                    LeaveRequestStatus.APPROVED
            );

    private final StudentLeaveRequestRepository studentLeaveRequestRepository;
    private final StudentLeaveAuditRepository studentLeaveAuditRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public StudentLeaveResponse create(
            CreateStudentLeaveRequest request,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, request.institutionId());

        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleViolationException(
                    "Leave end date cannot be before its start date");
        }

        Student student = studentRepository
                .findByIdAndActiveTrue(request.studentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Active student not found"));

        if (!student.getInstitution().getId()
                .equals(request.institutionId())) {
            throw new BusinessRuleViolationException(
                    "Student does not belong to the requested institution");
        }

        if (!studentEnrollmentRepository.existsByStudent_IdAndStatus(
                student.getId(), EnrollmentStatus.ACTIVE)) {
            throw new BusinessRuleViolationException(
                    "Student must have an active enrollment to take leave");
        }

        LeaveType leaveType = leaveTypeRepository.findById(request.leaveTypeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Leave type not found"));

        if (!leaveType.isActive()) {
            throw new BusinessRuleViolationException(
                    "This leave type is inactive");
        }

        boolean overlaps = studentLeaveRequestRepository
                .existsByStudent_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        student.getId(),
                        OVERLAPPING_STATUSES,
                        request.endDate(),
                        request.startDate());

        if (overlaps) {
            throw new DuplicateResourceException(
                    "This student already has a pending or approved "
                            + "leave request overlapping these dates");
        }

        StudentLeaveRequest leaveRequest = new StudentLeaveRequest();
        leaveRequest.setStudent(student);
        leaveRequest.setInstitution(student.getInstitution());
        leaveRequest.setLeaveType(leaveType);
        leaveRequest.setStartDate(request.startDate());
        leaveRequest.setEndDate(request.endDate());
        leaveRequest.setReason(normalize(request.reason()));

        StudentLeaveRequest saved =
                studentLeaveRequestRepository.save(leaveRequest);

        return toResponse(saved);
    }

    @Transactional
    public StudentLeaveResponse approve(
            UUID leaveId,
            ReviewStudentLeaveRequest request,
            Authentication authentication
    ) {
        return review(
                leaveId, LeaveRequestStatus.APPROVED,
                request.comment(), authentication);
    }

    @Transactional
    public StudentLeaveResponse reject(
            UUID leaveId,
            ReviewStudentLeaveRequest request,
            Authentication authentication
    ) {
        return review(
                leaveId, LeaveRequestStatus.REJECTED,
                request.comment(), authentication);
    }

    private StudentLeaveResponse review(
            UUID leaveId,
            LeaveRequestStatus newStatus,
            String comment,
            Authentication authentication
    ) {
        StudentLeaveRequest leave =
                studentLeaveRequestRepository.findById(leaveId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student leave request not found"));

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

        StudentLeaveRequest saved =
                studentLeaveRequestRepository.save(leave);

        studentLeaveAuditRepository.save(new StudentLeaveAudit(
                saved, previousStatus, newStatus,
                reviewer, normalize(comment)));

        return toResponse(saved);
    }

    @Transactional
    public StudentLeaveResponse cancel(
            UUID leaveRequestId,
            Authentication authentication
    ) {
        StudentLeaveRequest leaveRequest =
                studentLeaveRequestRepository.findById(leaveRequestId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student leave request not found"));

        requireInstitutionAccess(
                authentication, leaveRequest.getInstitution().getId());

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessRuleViolationException(
                    "Only pending leave requests can be cancelled");
        }

        UserAccount currentUser = getAuthenticatedUser(authentication);

        LeaveRequestStatus previousStatus = leaveRequest.getStatus();

        leaveRequest.setStatus(LeaveRequestStatus.CANCELLED);

        StudentLeaveRequest savedRequest =
                studentLeaveRequestRepository.save(leaveRequest);

        studentLeaveAuditRepository.save(new StudentLeaveAudit(
                savedRequest,
                previousStatus,
                LeaveRequestStatus.CANCELLED,
                currentUser,
                "Leave request cancelled by requester or authorized administrator"
        ));

        return toResponse(savedRequest);
    }

    @Transactional(readOnly = true)
    public Page<StudentLeaveResponse> list(
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

        return studentLeaveRequestRepository
                .findByInstitution_IdAndStatusOrderByStartDateAsc(
                        institutionId, status, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<StudentLeaveAuditResponse> getAudit(
            UUID leaveId,
            Authentication authentication
    ) {
        StudentLeaveRequest leave =
                studentLeaveRequestRepository.findById(leaveId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student leave request not found"));

        requireInstitutionAccess(
                authentication, leave.getInstitution().getId());

        return studentLeaveAuditRepository
                .findByLeaveRequest_IdOrderByChangedAtDesc(leaveId)
                .stream()
                .map(audit -> new StudentLeaveAuditResponse(
                        audit.getId(),
                        audit.getPreviousStatus(),
                        audit.getNewStatus(),
                        audit.getChangedBy().getId(),
                        audit.getComment(),
                        audit.getChangedAt()
                ))
                .toList();
    }

    private StudentLeaveResponse toResponse(StudentLeaveRequest leave) {
        return new StudentLeaveResponse(
                leave.getId(),
                leave.getStudent().getId(),
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
