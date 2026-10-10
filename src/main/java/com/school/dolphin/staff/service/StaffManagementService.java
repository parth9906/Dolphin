
package com.school.dolphin.staff.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.dto.CreateStaffRequest;
import com.school.dolphin.staff.dto.StaffAssignmentResponse;
import com.school.dolphin.staff.dto.UpdateStaffAssignmentStatusRequest;
import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffMember;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;
import com.school.dolphin.staff.repository.StaffMemberRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class StaffManagementService {

    private final StaffMemberRepository staffMemberRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    public StaffManagementService(
            StaffMemberRepository staffMemberRepository,
            StaffAssignmentRepository staffAssignmentRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository,
            UserAccountRepository userAccountRepository,
            OrganizationScopeAuthorization scopeAuthorization
    ) {
        this.staffMemberRepository = staffMemberRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
        this.userAccountRepository = userAccountRepository;
        this.scopeAuthorization = scopeAuthorization;
    }

    @Transactional
    public StaffAssignmentResponse createStaff(
            CreateStaffRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign staff to an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        String employeeNumber = request.employeeNumber().trim();

        if (staffAssignmentRepository
                .existsByInstitution_IdAndEmployeeNumber(
                        institution.getId(), employeeNumber)) {
            throw new DuplicateResourceException(
                    "Employee number already exists in this institution");
        }

        Campus campus = null;
        if (request.campusId() != null) {
            campus = campusRepository.findById(request.campusId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Campus not found"));

            if (!campus.isActive()
                    || !campus.getInstitution().getId()
                    .equals(institution.getId())) {
                throw new BusinessRuleViolationException(
                        "Campus must be active and belong to the selected institution");
            }
        }

        UserAccount userAccount = null;
        if (request.userAccountId() != null) {
            userAccount = userAccountRepository
                    .findById(request.userAccountId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("User account not found"));

            if (!userAccount.isActive()) {
                throw new BusinessRuleViolationException(
                        "Cannot link an inactive user account");
            }
        }

        if (request.startDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "Staff assignment start date cannot be in the future");
        }

        StaffMember member = new StaffMember();
        member.setUserAccount(userAccount);
        member.setFirstName(request.firstName().trim());
        member.setLastName(request.lastName().trim());
        member.setEmail(normalize(request.email()));
        member.setPhone(normalize(request.phone()));
        member.setActive(true);

        StaffMember savedMember = staffMemberRepository.save(member);

        StaffAssignment assignment = new StaffAssignment();
        assignment.setStaffMember(savedMember);
        assignment.setInstitution(institution);
        assignment.setCampus(campus);
        assignment.setEmployeeNumber(employeeNumber);
        assignment.setStaffType(request.staffType());
        assignment.setJobTitle(request.jobTitle().trim());
        assignment.setStartDate(request.startDate());
        assignment.setStatus(StaffAssignmentStatus.ACTIVE);

        return toResponse(staffAssignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public Page<StaffAssignmentResponse> getStaffByInstitution(
            UUID institutionId,
            StaffAssignmentStatus status,
            Pageable pageable,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return staffAssignmentRepository
                .findByInstitution_IdAndStatus(
                        institutionId, status, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public StaffAssignmentResponse updateAssignmentStatus(
            UUID assignmentId,
            UpdateStaffAssignmentStatusRequest request,
            Authentication authentication
    ) {
        StaffAssignment assignment = staffAssignmentRepository
                .findById(assignmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Staff assignment not found"));

        requireInstitutionAccess(
                authentication, assignment.getInstitution().getId());

        if (assignment.getStatus() == StaffAssignmentStatus.TERMINATED
                || assignment.getStatus() == StaffAssignmentStatus.INACTIVE) {
            throw new BusinessRuleViolationException(
                    "An inactive or terminated assignment cannot be reactivated "
                            + "through this endpoint");
        }

        if (request.status() == StaffAssignmentStatus.ACTIVE
                && assignment.getEndDate() != null) {
            throw new BusinessRuleViolationException(
                    "An assignment with an end date cannot be reactivated");
        }

        assignment.setStatus(request.status());

        if (request.status() == StaffAssignmentStatus.TERMINATED
                && assignment.getEndDate() == null) {
            assignment.setEndDate(LocalDate.now());
        }

        return toResponse(staffAssignmentRepository.save(assignment));
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

    private StaffAssignmentResponse toResponse(
            StaffAssignment assignment
    ) {
        StaffMember member = assignment.getStaffMember();

        return new StaffAssignmentResponse(
                member.getId(),
                assignment.getId(),
                assignment.getInstitution().getId(),
                assignment.getCampus() == null
                        ? null : assignment.getCampus().getId(),
                member.getUserAccount() == null
                        ? null : member.getUserAccount().getId(),
                member.getFirstName(),
                member.getLastName(),
                member.getEmail(),
                member.getPhone(),
                assignment.getEmployeeNumber(),
                assignment.getStaffType(),
                assignment.getJobTitle(),
                assignment.getStartDate(),
                assignment.getEndDate(),
                assignment.getStatus()
        );
    }
}