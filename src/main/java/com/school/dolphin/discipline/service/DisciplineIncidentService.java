package com.school.dolphin.discipline.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.discipline.dto.CreateDisciplineIncidentRequest;
import com.school.dolphin.discipline.dto.DisciplineIncidentResponse;
import com.school.dolphin.discipline.dto.UpdateDisciplineIncidentStatusRequest;
import com.school.dolphin.discipline.entity.DisciplineIncident;
import com.school.dolphin.discipline.entity.DisciplineIncidentStatus;
import com.school.dolphin.discipline.entity.DisciplineSeverity;
import com.school.dolphin.discipline.repository.DisciplineIncidentRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisciplineIncidentService {

    private static final int MAX_PAGE_SIZE = 100;

    private static final Map<DisciplineIncidentStatus, Set<DisciplineIncidentStatus>>
            ALLOWED_TRANSITIONS = Map.of(
                    DisciplineIncidentStatus.OPEN, Set.of(
                            DisciplineIncidentStatus.UNDER_REVIEW,
                            DisciplineIncidentStatus.RESOLVED,
                            DisciplineIncidentStatus.CLOSED),
                    DisciplineIncidentStatus.UNDER_REVIEW, Set.of(
                            DisciplineIncidentStatus.RESOLVED,
                            DisciplineIncidentStatus.CLOSED),
                    DisciplineIncidentStatus.RESOLVED, Set.of(
                            DisciplineIncidentStatus.CLOSED),
                    DisciplineIncidentStatus.CLOSED, Set.of()
            );

    private final DisciplineIncidentRepository disciplineIncidentRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final StudentRepository studentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public DisciplineIncidentResponse create(
            CreateDisciplineIncidentRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot record an incident for an inactive institution");
        }

        requireInstitutionAccess(authentication, institution.getId());

        Student student = requireStudentInInstitution(
                request.studentId(), institution.getId());

        Campus campus = resolveCampus(
                request.campusId(), institution.getId(), student);

        UserAccount reporter =
                authenticatedUserResolver.requireUserAccount(authentication);

        DisciplineIncident incident = DisciplineIncident.builder()
                .institution(institution)
                .campus(campus)
                .student(student)
                .category(request.category())
                .severity(request.severity())
                .description(request.description().trim())
                .incidentDate(request.incidentDate())
                .status(DisciplineIncidentStatus.OPEN)
                .reportedBy(reporter)
                .build();

        return toResponse(disciplineIncidentRepository.save(incident));
    }

    @Transactional(readOnly = true)
    public DisciplineIncidentResponse getById(
            UUID incidentId,
            Authentication authentication
    ) {
        DisciplineIncident incident = disciplineIncidentRepository
                .findById(incidentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Discipline incident not found"));

        requireInstitutionAccess(
                authentication, incident.getInstitution().getId());

        return toResponse(incident);
    }

    @Transactional(readOnly = true)
    public Page<DisciplineIncidentResponse> search(
            UUID institutionId,
            UUID studentId,
            UUID campusId,
            DisciplineIncidentStatus status,
            DisciplineSeverity severity,
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

        if (studentId != null) {
            requireStudentInInstitution(studentId, institutionId);
        }

        if (campusId != null) {
            requireCampusInInstitution(campusId, institutionId);
        }

        return disciplineIncidentRepository
                .search(
                        institutionId,
                        studentId,
                        campusId,
                        status,
                        severity,
                        fromDate,
                        toDate,
                        pageable)
                .map(this::toResponse);
    }

    @Transactional
    public DisciplineIncidentResponse updateStatus(
            UUID incidentId,
            UpdateDisciplineIncidentStatusRequest request,
            Authentication authentication
    ) {
        DisciplineIncident incident = disciplineIncidentRepository
                .findById(incidentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Discipline incident not found"));

        requireInstitutionAccess(
                authentication, incident.getInstitution().getId());

        DisciplineIncidentStatus current = incident.getStatus();
        DisciplineIncidentStatus target = request.status();

        if (current == target) {
            throw new BusinessRuleViolationException(
                    "Incident is already in status " + target);
        }

        if (!ALLOWED_TRANSITIONS
                .getOrDefault(current, Set.of())
                .contains(target)) {
            throw new BusinessRuleViolationException(
                    "Cannot transition incident from " + current
                            + " to " + target);
        }

        incident.setStatus(target);

        return toResponse(disciplineIncidentRepository.save(incident));
    }

    /**
     * An incident defaults to the student's campus when the caller does not
     * specify one, so institution-wide reporting still lands on a campus when
     * the student has one.
     */
    private Campus resolveCampus(
            UUID campusId,
            UUID institutionId,
            Student student
    ) {
        if (campusId == null) {
            return student.getCampus();
        }

        Campus campus = requireCampusInInstitution(campusId, institutionId);

        if (!campus.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot record an incident for an inactive campus");
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

    private Student requireStudentInInstitution(
            UUID studentId,
            UUID institutionId
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        if (!student.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Student does not belong to the requested institution");
        }

        return student;
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

    private DisciplineIncidentResponse toResponse(
            DisciplineIncident incident
    ) {
        Student student = incident.getStudent();

        return new DisciplineIncidentResponse(
                incident.getId(),
                incident.getInstitution().getId(),
                incident.getCampus() == null
                        ? null : incident.getCampus().getId(),
                student.getId(),
                student.getAdmissionNumber(),
                incident.getCategory(),
                incident.getSeverity(),
                incident.getDescription(),
                incident.getIncidentDate(),
                incident.getStatus(),
                incident.getReportedBy().getId(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}
