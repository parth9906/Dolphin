package com.school.dolphin.homework.service;

import com.school.dolphin.academic.entity.ClassSection;
import com.school.dolphin.academic.repository.ClassSectionRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.homework.dto.AssignmentResponse;
import com.school.dolphin.homework.dto.CreateAssignmentRequest;
import com.school.dolphin.homework.dto.UpdateAssignmentRequest;
import com.school.dolphin.homework.dto.PublishAssignmentRequest;
import com.school.dolphin.homework.entity.Assignment;
import com.school.dolphin.homework.entity.AssignmentStatus;
import com.school.dolphin.homework.repository.AssignmentRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.entity.StaffMember;
import com.school.dolphin.staff.repository.StaffMemberRepository;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffType;
import com.school.dolphin.timetable.repository.ScheduledLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final InstitutionRepository institutionRepository;
    private final ClassSectionRepository classSectionRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final ScheduledLessonRepository scheduledLessonRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public AssignmentResponse create(
            CreateAssignmentRequest request,
            Authentication authentication
    ) {
        validateInstitutionAccess(authentication, request.institutionId());

        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        ClassSection section = classSectionRepository
                .findById(request.sectionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Class section not found"));

        validateSectionBelongsToInstitution(section, institution.getId());

        StaffMember creator = findCurrentActiveStaffMember(authentication);

        if (!section.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an assignment for an inactive section");
        }

        if (!section.getSchoolClass().isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an assignment for an inactive class");
        }

        ensureStaffCanTeachSection(creator, section, institution.getId());

        Assignment assignment = new Assignment();
        assignment.setInstitution(institution);
        assignment.setSection(section);
        assignment.setCreatedBy(creator);
        assignment.setTitle(request.title().trim());
        assignment.setInstructions(request.instructions().trim());
        assignment.setDueAt(request.dueAt());
        assignment.setMaxMarks(request.maxMarks());
        assignment.setStatus(AssignmentStatus.DRAFT);

        return AssignmentResponse.from(
                assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public AssignmentResponse getById(
            UUID assignmentId,
            Authentication authentication
    ) {
        Assignment assignment = findAssignment(assignmentId);
        validateInstitutionAccess(
                authentication, assignment.getInstitution().getId());

        return AssignmentResponse.from(assignment);
    }

    @Transactional(readOnly = true)
    public Page<AssignmentResponse> search(
            UUID institutionId,
            UUID sectionId,
            AssignmentStatus status,
            Pageable pageable,
            Authentication authentication
    ) {
        validateInstitutionAccess(authentication, institutionId);

        if (sectionId != null) {
            ClassSection section = classSectionRepository.findById(sectionId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Class section not found"));

            validateSectionBelongsToInstitution(section, institutionId);
        }

        return assignmentRepository
                .search(institutionId, sectionId, status, pageable)
                .map(AssignmentResponse::from);
    }

    @Transactional
    public AssignmentResponse updateDraft(
            UUID assignmentId,
            UpdateAssignmentRequest request,
            Authentication authentication
    ) {
        Assignment assignment = findAssignment(assignmentId);
        validateInstitutionAccess(
                authentication, assignment.getInstitution().getId());
        ensureDraft(assignment);
        ensureCurrentStaffCanManageAssignment(authentication, assignment);
        ensureVersion(assignment, request.version());

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new BusinessRuleViolationException("Title cannot be blank");
            }
            assignment.setTitle(request.title().trim());
        }

        if (request.instructions() != null) {
            if (request.instructions().isBlank()) {
                throw new BusinessRuleViolationException(
                        "Instructions cannot be blank");
            }
            assignment.setInstructions(request.instructions().trim());
        }

        if (request.dueAt() != null) {
            assignment.setDueAt(request.dueAt());
        }

        if (request.maxMarks() != null) {
            assignment.setMaxMarks(request.maxMarks());
        }

        return AssignmentResponse.from(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentResponse publish(
            UUID assignmentId,
            PublishAssignmentRequest request,
            Authentication authentication
    ) {
        Assignment assignment = findAssignment(assignmentId);
        validateInstitutionAccess(
                authentication, assignment.getInstitution().getId());

        ensureDraft(assignment);
        ensureCurrentStaffCanManageAssignment(authentication, assignment);
        ensureVersion(assignment, request.version());

        if (!assignment.getDueAt().isAfter(OffsetDateTime.now())) {
            throw new BusinessRuleViolationException(
                    "Assignment due date must be in the future");
        }

        if (assignment.getTitle() == null
                || assignment.getTitle().isBlank()
                || assignment.getInstructions() == null
                || assignment.getInstructions().isBlank()
                || assignment.getMaxMarks() == null
                || assignment.getMaxMarks().signum() <= 0) {
            throw new BusinessRuleViolationException(
                    "Assignment must have a title, instructions and valid maximum marks");
        }

        assignment.publish();

        return AssignmentResponse.from(assignmentRepository.save(assignment));
    }

    private Assignment findAssignment(UUID assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assignment not found"));
    }

    private void validateInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }
    }

    private void validateSectionBelongsToInstitution(
            ClassSection section,
            UUID institutionId
    ) {
        UUID sectionInstitutionId = section.getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        if (!institutionId.equals(sectionInstitutionId)) {
            throw new BusinessRuleViolationException(
                    "Class section does not belong to the requested institution");
        }
    }

    private StaffMember findCurrentActiveStaffMember(
            Authentication authentication
    ) {
        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        StaffMember staff = staffMemberRepository
                .findByUserAccount_Id(user.getId())
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "A linked staff profile is required"));

        if (!staff.isActive()) {
            throw new AccessDeniedException(
                    "Inactive staff members cannot create assignments");
        }

        return staff;
    }

    private void ensureCurrentStaffCanManageAssignment(
            Authentication authentication,
            Assignment assignment
    ) {
        StaffMember staff = findCurrentActiveStaffMember(authentication);

        if (!staff.getId().equals(assignment.getCreatedBy().getId())) {
            throw new AccessDeniedException(
                    "Only the assignment creator can modify or publish it");
        }

        ensureStaffCanTeachSection(
                staff,
                assignment.getSection(),
                assignment.getInstitution().getId());
    }

    private void ensureStaffCanTeachSection(
            StaffMember staff,
            ClassSection section,
            UUID institutionId
    ) {
        LocalDate today = LocalDate.now();

        boolean teachesSection = scheduledLessonRepository
                .existsActiveTeachingAssignmentForSection(
                                section.getId(),
                                staff.getId(),
                                institutionId,
                                StaffAssignmentStatus.ACTIVE,
                                StaffType.TEACHER,
                                today
                        );

        if (!teachesSection) {
            throw new AccessDeniedException(
                    "You are not authorized to manage assignments for this section");
        }
    }

    private void ensureDraft(Assignment assignment) {
        if (assignment.getStatus() != AssignmentStatus.DRAFT) {
            throw new BusinessRuleViolationException(
                    "Only draft assignments can be modified or published");
        }
    }

    private void ensureVersion(Assignment assignment, Long version) {
        if (!assignment.getVersion().equals(version)) {
            throw new StaleResourceVersionException(
                    "The assignment was modified by another request. Reload it and try again.");
        }
    }
}
