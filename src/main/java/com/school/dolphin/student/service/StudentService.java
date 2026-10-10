package com.school.dolphin.student.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.dto.CreateStudentRequest;
import com.school.dolphin.student.dto.StudentResponse;
import com.school.dolphin.student.dto.UpdateStudentRequest;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;

    public StudentService(
            StudentRepository studentRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository,
            OrganizationScopeAuthorization organizationScopeAuthorization
    ) {
        this.studentRepository = studentRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
        this.organizationScopeAuthorization = organizationScopeAuthorization;
    }

    @Transactional
    public StudentResponse createStudent(
            CreateStudentRequest request,
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
                    "Cannot create a student in an inactive institution"
            );
        }

        Campus campus = null;

        if (request.campusId() != null) {
            campus = campusRepository.findById(request.campusId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Campus not found"
                            ));

            if (!campus.isActive()) {
                throw new BusinessRuleViolationException(
                        "Cannot create a student in an inactive campus"
                );
            }

            if (!campus.getInstitution().getId()
                    .equals(institution.getId())) {
                throw new BusinessRuleViolationException(
                        "Campus does not belong to the selected institution"
                );
            }

            if (!organizationScopeAuthorization.canAccessCampus(
                    authentication, campus.getId())) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "You do not have access to this campus"
                );
            }
        } else {
            if (!organizationScopeAuthorization.canAccessInstitution(
                    authentication, institution.getId())) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "You do not have access to this institution"
                );
            }
        }

        String admissionNumber = request.admissionNumber().trim();

        if (studentRepository
                .existsByInstitution_IdAndAdmissionNumber(
                        institution.getId(),
                        admissionNumber
                )) {
            throw new DuplicateResourceException(
                    "Admission number already exists in this institution"
            );
        }

        Student student = Student.builder()
                .institution(institution)
                .campus(campus)
                .admissionNumber(admissionNumber)
                .firstName(request.firstName().trim())
                .lastName(request.lastName() == null
                        ? null
                        : request.lastName().trim())
                .dateOfBirth(request.dateOfBirth())
                .active(true)
                .build();

        return toResponse(studentRepository.save(student));
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudent(
            UUID studentId,
            Authentication authentication
    ) {
        Student student = studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student not found"
                        ));

        boolean allowed;

        if (student.getCampus() != null) {
            allowed = organizationScopeAuthorization.canAccessCampus(
                    authentication,
                    student.getCampus().getId()
            );
        } else {
            allowed = organizationScopeAuthorization.canAccessInstitution(
                    authentication,
                    student.getInstitution().getId()
            );
        }

        if (!allowed) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have access to this student"
            );
        }

        return toResponse(student);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> searchStudents(
            UUID institutionId,
            UUID campusId,
            String search,
            Pageable pageable,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(institutionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot search students in an inactive institution"
            );
        }

        if (campusId != null) {
            Campus campus = campusRepository.findById(campusId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Campus not found"));

            if (!campus.isActive()) {
                throw new BusinessRuleViolationException(
                        "Cannot search students in an inactive campus"
                );
            }

            if (!campus.getInstitution().getId().equals(institutionId)) {
                throw new BusinessRuleViolationException(
                        "Campus does not belong to the selected institution"
                );
            }

            if (!organizationScopeAuthorization.canAccessCampus(authentication, campusId)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "You do not have access to this campus"
                );
            }
        } else {
            if (!organizationScopeAuthorization.canAccessInstitution(
                    authentication, institutionId)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "You do not have access to this institution"
                );
            }
        }

        // Never let a client request an arbitrarily large page.
        int safePageSize = Math.min(pageable.getPageSize(), 100);

        Pageable safePageable = PageRequest.of(
                pageable.getPageNumber(),
                safePageSize,
                pageable.getSort()
        );

        String searchTerm =
                search == null || search.isBlank()
                        ? null
                        : search.trim();

        return studentRepository.searchActiveStudents(
                        institutionId,
                        campusId,
                        searchTerm,
                        safePageable
                )
                .map(this::toResponse);
    }


    @Transactional
    public StudentResponse updateStudent(
            UUID studentId,
            UpdateStudentRequest request,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found"));

        checkStudentAccess(student, authentication);

        String admissionNumber = request.admissionNumber().trim();

        boolean duplicate =
                studentRepository
                        .existsByInstitution_IdAndAdmissionNumberAndIdNot(
                                student.getInstitution().getId(),
                                admissionNumber,
                                studentId
                        );

        if (duplicate) {
            throw new DuplicateResourceException(
                    "Admission number already exists in this institution"
            );
        }

        student.setAdmissionNumber(admissionNumber);
        student.setFirstName(request.firstName().trim());
        student.setLastName(
                request.lastName() == null
                        ? null
                        : request.lastName().trim()
        );
        student.setDateOfBirth(request.dateOfBirth());

        Student saved = studentRepository.save(student);
        return toResponse(saved);
    }

    @Transactional
    public StudentResponse deactivateStudent(
            UUID studentId,
            Authentication authentication
    ) {
        // Find by ID, including inactive students, so deactivation can be repeated safely.
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        checkStudentAccess(student, authentication);

        if (student.isActive()) {
            student.setActive(false);
            studentRepository.save(student);
        }

        return toResponse(student);
    }

    private void checkStudentAccess(
            Student student,
            Authentication authentication
    ) {
        boolean allowed;

        if (student.getCampus() != null) {
            allowed = organizationScopeAuthorization.canAccessCampus(
                    authentication,
                    student.getCampus().getId()
            );
        } else {
            allowed = organizationScopeAuthorization.canAccessInstitution(
                    authentication,
                    student.getInstitution().getId()
            );
        }

        if (!allowed) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have access to this student's organization"
            );
        }
    }

    private StudentResponse toResponse(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getInstitution().getId(),
                student.getCampus() == null
                        ? null
                        : student.getCampus().getId(),
                student.getAdmissionNumber(),
                student.getFirstName(),
                student.getLastName(),
                student.getDateOfBirth(),
                student.isActive()
        );
    }
}