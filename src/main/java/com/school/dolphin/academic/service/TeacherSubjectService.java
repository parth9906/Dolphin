
package com.school.dolphin.academic.service;

import com.school.dolphin.academic.dto.AcademicSubjectResponse;
import com.school.dolphin.academic.dto.AssignTeacherSubjectRequest;
import com.school.dolphin.academic.dto.CreateAcademicSubjectRequest;
import com.school.dolphin.academic.dto.TeacherSubjectAssignmentResponse;
import com.school.dolphin.academic.entity.AcademicSubject;
import com.school.dolphin.academic.entity.TeacherSubjectAssignment;
import com.school.dolphin.academic.repository.AcademicSubjectRepository;
import com.school.dolphin.academic.repository.TeacherSubjectAssignmentRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffType;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class TeacherSubjectService {

    private final AcademicSubjectRepository subjectRepository;
    private final TeacherSubjectAssignmentRepository assignmentRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final InstitutionRepository institutionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    public TeacherSubjectService(
            AcademicSubjectRepository subjectRepository,
            TeacherSubjectAssignmentRepository assignmentRepository,
            StaffAssignmentRepository staffAssignmentRepository,
            InstitutionRepository institutionRepository,
            OrganizationScopeAuthorization scopeAuthorization
    ) {
        this.subjectRepository = subjectRepository;
        this.assignmentRepository = assignmentRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.institutionRepository = institutionRepository;
        this.scopeAuthorization = scopeAuthorization;
    }

    @Transactional
    public AcademicSubjectResponse createSubject(
            CreateAcademicSubjectRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        requireInstitutionAccess(authentication, institution.getId());

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot add subjects to an inactive institution");
        }

        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();

        if (subjectRepository.existsByInstitution_IdAndCodeIgnoreCase(
                institution.getId(), code)) {
            throw new DuplicateResourceException(
                    "Subject code already exists in this institution");
        }

        if (subjectRepository.existsByInstitution_IdAndNameIgnoreCase(
                institution.getId(), name)) {
            throw new DuplicateResourceException(
                    "Subject name already exists in this institution");
        }

        AcademicSubject subject = new AcademicSubject();
        subject.setInstitution(institution);
        subject.setCode(code);
        subject.setName(name);
        subject.setDescription(normalize(request.description()));
        subject.setActive(true);

        return toSubjectResponse(subjectRepository.save(subject));
    }

    @Transactional(readOnly = true)
    public List<AcademicSubjectResponse> getSubjects(
            UUID institutionId,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return subjectRepository
                .findByInstitution_IdAndActiveTrueOrderByNameAsc(institutionId)
                .stream()
                .map(this::toSubjectResponse)
                .toList();
    }

    @Transactional
    public TeacherSubjectAssignmentResponse assignTeacher(
            AssignTeacherSubjectRequest request,
            Authentication authentication
    ) {
        if (request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleViolationException(
                    "endDate must not be before startDate");
        }

        StaffAssignment staffAssignment = staffAssignmentRepository
                .findById(request.staffAssignmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Staff assignment not found"));

        UUID institutionId =
                staffAssignment.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (staffAssignment.getStatus() != StaffAssignmentStatus.ACTIVE
                || !staffAssignment.getStaffMember().isActive()) {
            throw new BusinessRuleViolationException(
                    "Teacher must have an active staff assignment");
        }

        if (staffAssignment.getStaffType() != StaffType.TEACHER) {
            throw new BusinessRuleViolationException(
                    "Only staff with type TEACHER can receive subject assignments");
        }

        AcademicSubject subject = subjectRepository
                .findById(request.subjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject not found"));

        if (!subject.isActive()
                || !subject.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Subject must be active and belong to the teacher's institution");
        }

        if (assignmentRepository
                .existsByStaffAssignment_IdAndSubject_IdAndActiveTrue(
                        staffAssignment.getId(), subject.getId())) {
            throw new DuplicateResourceException(
                    "Teacher already has an active assignment for this subject");
        }

        TeacherSubjectAssignment assignment =
                new TeacherSubjectAssignment();

        assignment.setStaffAssignment(staffAssignment);
        assignment.setSubject(subject);
        assignment.setStartDate(request.startDate());
        assignment.setEndDate(request.endDate());
        assignment.setActive(true);

        return toAssignmentResponse(
                assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<TeacherSubjectAssignmentResponse> getAssignments(
            UUID institutionId,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return assignmentRepository
                .findByStaffAssignment_Institution_IdAndActiveTrueOrderByStartDateDesc(
                        institutionId)
                .stream()
                .map(this::toAssignmentResponse)
                .toList();
    }

    @Transactional
    public TeacherSubjectAssignmentResponse endAssignment(
            UUID assignmentId,
            LocalDate endDate,
            Authentication authentication
    ) {
        TeacherSubjectAssignment assignment = assignmentRepository
                .findById(assignmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Teacher-subject assignment not found"));

        UUID institutionId = assignment.getStaffAssignment()
                .getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!assignment.isActive()) {
            throw new BusinessRuleViolationException(
                    "Assignment has already ended");
        }

        if (endDate == null || endDate.isBefore(assignment.getStartDate())) {
            throw new BusinessRuleViolationException(
                    "endDate must not be before startDate");
        }

        assignment.setEndDate(endDate);
        assignment.setActive(false);

        return toAssignmentResponse(assignmentRepository.save(assignment));
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
        return value == null || value.isBlank() ? null : value.trim();
    }

    private AcademicSubjectResponse toSubjectResponse(
            AcademicSubject subject
    ) {
        return new AcademicSubjectResponse(
                subject.getId(),
                subject.getInstitution().getId(),
                subject.getCode(),
                subject.getName(),
                subject.getDescription(),
                subject.isActive()
        );
    }

    private TeacherSubjectAssignmentResponse toAssignmentResponse(
            TeacherSubjectAssignment assignment
    ) {
        var staffAssignment = assignment.getStaffAssignment();
        var member = staffAssignment.getStaffMember();
        var subject = assignment.getSubject();

        return new TeacherSubjectAssignmentResponse(
                assignment.getId(),
                staffAssignment.getId(),
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                staffAssignment.getEmployeeNumber(),
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                assignment.getStartDate(),
                assignment.getEndDate(),
                assignment.isActive()
        );
    }
}