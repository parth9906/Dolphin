package com.school.dolphin.admissions.service;

import com.school.dolphin.academic.entity.AcademicYearStatus;
import com.school.dolphin.academic.entity.SchoolClass;
import com.school.dolphin.academic.repository.SchoolClassRepository;
import com.school.dolphin.admissions.dto.AdmissionApplicationResponse;
import com.school.dolphin.admissions.dto.CreateAdmissionApplicationRequest;
import com.school.dolphin.admissions.entity.AdmissionApplication;
import com.school.dolphin.admissions.entity.AdmissionApplicationStatus;
import com.school.dolphin.admissions.repository.AdmissionApplicationRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdmissionApplicationService {

    private static final int MAX_PAGE_SIZE = 100;

    private static final List<AdmissionApplicationStatus>
            ACTIVE_DUPLICATE_STATUSES = List.of(
                    AdmissionApplicationStatus.APPLIED,
                    AdmissionApplicationStatus.UNDER_REVIEW);

    private final AdmissionApplicationRepository admissionApplicationRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public AdmissionApplicationResponse create(
            CreateAdmissionApplicationRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot accept applications for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId());

        SchoolClass applyingClass = requireApplyingClass(
                request.applyingClassId(), institution.getId());

        LocalDate applicationDate = request.applicationDate() == null
                ? LocalDate.now() : request.applicationDate();

        if (applicationDate.isAfter(LocalDate.now())) {
            throw new BusinessRuleViolationException(
                    "Application date cannot be in the future");
        }

        String firstName = request.applicantFirstName().trim();
        String lastName = request.applicantLastName().trim();

        requireNoActiveDuplicate(
                institution.getId(),
                firstName,
                lastName,
                request.applicantDateOfBirth());

        UserAccount creator =
                authenticatedUserResolver.requireUserAccount(authentication);

        AdmissionApplication application = AdmissionApplication.builder()
                .institution(institution)
                .campus(campus)
                .applyingClass(applyingClass)
                .applicantFirstName(firstName)
                .applicantLastName(lastName)
                .applicantDateOfBirth(request.applicantDateOfBirth())
                .parentName(normalize(request.parentName()))
                .parentPhone(normalize(request.parentPhone()))
                .parentEmail(normalize(request.parentEmail()))
                .notes(normalize(request.notes()))
                .applicationDate(applicationDate)
                .status(AdmissionApplicationStatus.APPLIED)
                .createdBy(creator)
                .build();

        return toResponse(admissionApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public AdmissionApplicationResponse getById(
            UUID applicationId,
            Authentication authentication
    ) {
        AdmissionApplication application = admissionApplicationRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Admission application not found"));

        requireInstitutionAccess(
                authentication, application.getInstitution().getId());

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public Page<AdmissionApplicationResponse> search(
            UUID institutionId,
            UUID campusId,
            AdmissionApplicationStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable,
            Authentication authentication
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessRuleViolationException(
                    "fromDate must not be after toDate");
        }

        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        requireInstitutionAccess(authentication, institutionId);

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return admissionApplicationRepository
                .search(
                        institutionId,
                        campusId,
                        status,
                        fromDate,
                        toDate,
                        pageable)
                .map(this::toResponse);
    }

    private void requireNoActiveDuplicate(
            UUID institutionId,
            String firstName,
            String lastName,
            LocalDate dateOfBirth
    ) {
        long duplicates = admissionApplicationRepository
                .countByInstitution_IdAndApplicantFirstNameIgnoreCaseAndApplicantLastNameIgnoreCaseAndApplicantDateOfBirthAndStatusIn(
                        institutionId,
                        firstName,
                        lastName,
                        dateOfBirth,
                        ACTIVE_DUPLICATE_STATUSES);

        if (duplicates > 0) {
            throw new DuplicateResourceException(
                    "An active application already exists for this applicant");
        }
    }

    private Campus resolveCampus(
            UUID campusId,
            UUID institutionId
    ) {
        if (campusId == null) {
            return null;
        }

        Campus campus = requireCampusInInstitution(campusId, institutionId);

        if (!campus.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot accept applications for an inactive campus");
        }

        return campus;
    }

    private Campus requireCampusInInstitution(
            UUID campusId,
            UUID institutionId
    ) {
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Campus not found"));

        if (!campus.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Campus does not belong to the requested institution");
        }

        return campus;
    }

    private SchoolClass requireApplyingClass(
            UUID classId,
            UUID institutionId
    ) {
        SchoolClass schoolClass = schoolClassRepository.findById(classId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "School class not found"));

        if (!schoolClass.getAcademicYear()
                .getInstitution()
                .getId()
                .equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Class does not belong to the requested institution");
        }

        if (!schoolClass.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot accept applications for an inactive class");
        }

        if (schoolClass.getAcademicYear().getStatus()
                == AcademicYearStatus.CLOSED) {
            throw new BusinessRuleViolationException(
                    "Cannot accept applications for a closed academic year");
        }

        return schoolClass;
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private AdmissionApplicationResponse toResponse(
            AdmissionApplication application
    ) {
        SchoolClass schoolClass = application.getApplyingClass();

        return new AdmissionApplicationResponse(
                application.getId(),
                application.getInstitution().getId(),
                application.getCampus() == null
                        ? null : application.getCampus().getId(),
                schoolClass.getId(),
                schoolClass.getName(),
                schoolClass.getCode(),
                application.getApplicantFirstName(),
                application.getApplicantLastName(),
                application.getApplicantDateOfBirth(),
                application.getParentName(),
                application.getParentPhone(),
                application.getParentEmail(),
                application.getNotes(),
                application.getApplicationDate(),
                application.getStatus(),
                application.getCreatedBy().getId(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
