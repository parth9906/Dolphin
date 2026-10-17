
package com.school.dolphin.staff.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.dto.CreateUserInvitationRequest;
import com.school.dolphin.identity.dto.UserInvitationResponse;
import com.school.dolphin.identity.entity.OrganizationScopeType;
import com.school.dolphin.identity.entity.Role;
import com.school.dolphin.identity.repository.RoleRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.identity.service.UserInvitationService;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.dto.CreateStaffRequest;
import com.school.dolphin.staff.dto.StaffAssignmentResponse;
import com.school.dolphin.staff.dto.OnboardTeacherRequest;
import com.school.dolphin.staff.dto.TeacherOnboardingResponse;
import com.school.dolphin.staff.entity.StaffType;
import com.school.dolphin.staff.repository.StaffMemberRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TeacherOnboardingService {

    private final StaffManagementService staffManagementService;
    private final StaffMemberRepository staffMemberRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final RoleRepository roleRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final UserInvitationService userInvitationService;

    public TeacherOnboardingService(
            StaffManagementService staffManagementService,
            StaffMemberRepository staffMemberRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository,
            RoleRepository roleRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            UserInvitationService userInvitationService
    ) {
        this.staffManagementService = staffManagementService;
        this.staffMemberRepository = staffMemberRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
        this.roleRepository = roleRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.userInvitationService = userInvitationService;
    }

    @Transactional
    public TeacherOnboardingResponse onboardTeacher(
            OnboardTeacherRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Institution not found"
                        ));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot onboard a teacher into an inactive institution"
            );
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institution.getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        UUID campusId = request.campusId();

        if (campusId != null) {
            Campus campus = campusRepository.findById(campusId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Campus not found"));

            if (!campus.isActive()
                    || !campus.getInstitution().getId()
                    .equals(institution.getId())) {
                throw new BusinessRuleViolationException(
                        "Campus must be active and belong to the selected institution"
                );
            }

            if (!scopeAuthorization.canAccessCampus(
                    authentication, campusId)) {
                throw new AccessDeniedException(
                        "You do not have access to this campus"
                );
            }
        }

        Role teacherRole = roleRepository.findByCode("TEACHER")
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "TEACHER role is not configured"
                        ));

        if (!teacherRole.isActive()) {
            throw new BusinessRuleViolationException(
                    "The TEACHER role is inactive"
            );
        }

        CreateStaffRequest staffRequest = new CreateStaffRequest(
                institution.getId(),
                campusId,
                null,
                request.firstName(),
                request.lastName() == null ? "" : request.lastName(),
                request.email(),
                request.phone(),
                request.employeeNumber(),
                StaffType.TEACHER,
                request.jobTitle(),
                request.startDate()
        );

        StaffAssignmentResponse staffResponse =
                staffManagementService.createStaff(
                        staffRequest, authentication);

        var staffMember = staffMemberRepository
                .findById(staffResponse.staffMemberId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Created staff profile could not be found"
                        ));

        CreateUserInvitationRequest invitationRequest =
                new CreateUserInvitationRequest(
                        request.email(),
                        request.username(),
                        request.firstName(),
                        request.lastName(),
                        teacherRole.getId(),
                        OrganizationScopeType.INSTITUTION,
                        institution.getId()
                );

        UserInvitationResponse invitation =
                userInvitationService.createTeacherInvitation(
                        invitationRequest,
                        authentication,
                        staffMember
                );

        return new TeacherOnboardingResponse(
                null,
                staffResponse.staffMemberId(),
                staffResponse.assignmentId(),
                institution.getId(),
                campusId,
                request.username().trim(),
                request.email().trim(),
                "TEACHER",
                staffResponse.status().name(),
                invitation.status(),
                invitation.expiresAt(),
                "Teacher profile created; invitation is pending acceptance"
        );
    }
}
