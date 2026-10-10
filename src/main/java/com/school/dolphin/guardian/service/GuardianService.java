
package com.school.dolphin.guardian.service;

import com.school.dolphin.guardian.dto.*;
import com.school.dolphin.guardian.entity.Guardian;
import com.school.dolphin.guardian.entity.StudentGuardian;
import com.school.dolphin.guardian.repository.GuardianRepository;
import com.school.dolphin.guardian.repository.StudentGuardianRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class GuardianService {

    private static final Set<String> RELATIONSHIPS = Set.of(
            "FATHER",
            "MOTHER",
            "LEGAL_GUARDIAN",
            "GRANDFATHER",
            "GRANDMOTHER",
            "OTHER"
    );

    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    public GuardianService(
            GuardianRepository guardianRepository,
            StudentGuardianRepository studentGuardianRepository,
            StudentRepository studentRepository,
            InstitutionRepository institutionRepository,
            OrganizationScopeAuthorization scopeAuthorization
    ) {
        this.guardianRepository = guardianRepository;
        this.studentGuardianRepository = studentGuardianRepository;
        this.studentRepository = studentRepository;
        this.institutionRepository = institutionRepository;
        this.scopeAuthorization = scopeAuthorization;
    }

    @Transactional
    public GuardianResponse createGuardian(
            CreateGuardianRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create a guardian for an inactive institution"
            );
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institution.getId())) {
            throw new AccessDeniedException(
                    "You cannot manage guardians for this institution"
            );
        }

        Guardian guardian = Guardian.builder()
                .institution(institution)
                .firstName(request.firstName().trim())
                .lastName(trimToNull(request.lastName()))
                .email(trimToNull(request.email()))
                .phone(trimToNull(request.phone()))
                .active(true)
                .build();

        return toGuardianResponse(guardianRepository.save(guardian));
    }

    @Transactional(readOnly = true)
    public GuardianResponse getGuardian(
            UUID guardianId,
            Authentication authentication
    ) {
        Guardian guardian = guardianRepository.findByIdAndActiveTrue(guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Guardian not found"));

        requireInstitutionAccess(guardian, authentication);
        return toGuardianResponse(guardian);
    }

    @Transactional
    public StudentGuardianResponse linkGuardian(
            UUID studentId,
            UUID guardianId,
            LinkGuardianRequest request,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found"));

        Guardian guardian = guardianRepository.findByIdAndActiveTrue(guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active guardian not found"));

        requireStudentAccess(student, authentication);
        requireInstitutionAccess(guardian, authentication);

        if (!student.getInstitution().getId()
                .equals(guardian.getInstitution().getId())) {
            throw new BusinessRuleViolationException(
                    "Student and guardian must belong to the same institution"
            );
        }

        String relationship = request.relationshipType()
                .trim()
                .toUpperCase(java.util.Locale.ROOT);

        if (!RELATIONSHIPS.contains(relationship)) {
            throw new BusinessRuleViolationException(
                    "Unsupported relationship type: " + relationship
            );
        }

        if (studentGuardianRepository.existsByStudent_IdAndGuardian_Id(
                studentId, guardianId)) {
            throw new BusinessRuleViolationException(
                    "This guardian is already linked to the student"
            );
        }

        if (request.primaryContact()
                && studentGuardianRepository
                .existsByStudent_IdAndPrimaryContactTrue(studentId)) {
            throw new BusinessRuleViolationException(
                    "This student already has a primary contact"
            );
        }

        StudentGuardian link = StudentGuardian.builder()
                .student(student)
                .guardian(guardian)
                .relationshipType(relationship)
                .primaryContact(request.primaryContact())
                .pickupAuthorized(request.pickupAuthorized())
                .build();

        studentGuardianRepository.save(link);

        return toStudentGuardianResponse(link);
    }

    @Transactional(readOnly = true)
    public List<StudentGuardianResponse> getStudentGuardians(
            UUID studentId,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found"));

        requireStudentAccess(student, authentication);

        return studentGuardianRepository
                .findByStudent_IdAndGuardian_ActiveTrue(studentId)
                .stream()
                .map(this::toStudentGuardianResponse)
                .toList();
    }

    private void requireStudentAccess(
            Student student,
            Authentication authentication
    ) {
        boolean allowed;

        if (student.getCampus() != null) {
            allowed = scopeAuthorization.canAccessCampus(
                    authentication, student.getCampus().getId());
        } else {
            allowed = scopeAuthorization.canAccessInstitution(
                    authentication, student.getInstitution().getId());
        }

        if (!allowed) {
            throw new AccessDeniedException(
                    "You cannot access this student's organization"
            );
        }
    }

    private void requireInstitutionAccess(
            Guardian guardian,
            Authentication authentication
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, guardian.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You cannot access this guardian's organization"
            );
        }
    }

    private GuardianResponse toGuardianResponse(Guardian guardian) {
        return new GuardianResponse(
                guardian.getId(),
                guardian.getInstitution().getId(),
                guardian.getFirstName(),
                guardian.getLastName(),
                guardian.getEmail(),
                guardian.getPhone(),
                guardian.isActive()
        );
    }

    private StudentGuardianResponse toStudentGuardianResponse(
            StudentGuardian link
    ) {
        Guardian guardian = link.getGuardian();

        return new StudentGuardianResponse(
                guardian.getId(),
                guardian.getFirstName(),
                guardian.getLastName(),
                guardian.getEmail(),
                guardian.getPhone(),
                link.getRelationshipType(),
                link.isPrimaryContact(),
                link.isPickupAuthorized()
        );
    }


    @Transactional
    public GuardianResponse updateGuardian(
            UUID guardianId,
            UpdateGuardianRequest request,
            Authentication authentication
    ) {
        Guardian guardian = guardianRepository
                .findByIdAndActiveTrue(guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active guardian not found"));

        requireInstitutionAccess(guardian, authentication);

        guardian.setFirstName(request.firstName().trim());
        guardian.setLastName(trimToNull(request.lastName()));
        guardian.setEmail(trimToNull(request.email()));
        guardian.setPhone(trimToNull(request.phone()));

        return toGuardianResponse(guardianRepository.save(guardian));
    }

    @Transactional
    public GuardianResponse deactivateGuardian(
            UUID guardianId,
            Authentication authentication
    ) {
        Guardian guardian = guardianRepository.findById(guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Guardian not found"));

        requireInstitutionAccess(guardian, authentication);

        if (guardian.isActive()) {
            guardian.setActive(false);

            // Preserve relationship rows, but deactivate active links.
            List<StudentGuardian> links =
                    studentGuardianRepository
                            .findByGuardian_IdAndActiveTrue(guardianId);

            links.forEach(link -> link.setActive(false));
            studentGuardianRepository.saveAll(links);

            guardianRepository.save(guardian);
        }

        return toGuardianResponse(guardian);
    }

    @Transactional
    public void unlinkGuardian(
            UUID studentId,
            UUID guardianId,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found"));

        requireStudentAccess(student, authentication);

        StudentGuardian link = studentGuardianRepository
                .findByStudent_IdAndGuardian_IdAndActiveTrue(studentId, guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Active student-guardian relationship not found"
                        ));

        requireInstitutionAccess(link.getGuardian(), authentication);

        link.setActive(false);
        studentGuardianRepository.save(link);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}