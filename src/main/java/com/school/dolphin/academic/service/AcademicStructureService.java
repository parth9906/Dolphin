
package com.school.dolphin.academic.service;

import com.school.dolphin.academic.dto.*;
import com.school.dolphin.academic.entity.*;
import com.school.dolphin.academic.repository.*;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;

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
public class AcademicStructureService {

    private final AcademicYearRepository academicYearRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final ClassSectionRepository classSectionRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;
    private final StudentRepository studentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    public AcademicStructureService(
            AcademicYearRepository academicYearRepository,
            SchoolClassRepository schoolClassRepository,
            ClassSectionRepository classSectionRepository,
            StudentEnrollmentRepository studentEnrollmentRepository,
            InstitutionRepository institutionRepository,
            CampusRepository campusRepository,
            StudentRepository studentRepository,
            OrganizationScopeAuthorization scopeAuthorization
    ) {
        this.academicYearRepository = academicYearRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.classSectionRepository = classSectionRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.institutionRepository = institutionRepository;
        this.campusRepository = campusRepository;
        this.studentRepository = studentRepository;
        this.scopeAuthorization = scopeAuthorization;
    }

    @Transactional
    public UUID createAcademicYear(
            CreateAcademicYearRequest request,
            Authentication authentication
    ) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new BusinessRuleViolationException(
                    "Academic year endDate must be after startDate");
        }

        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        requireInstitutionAccess(authentication, institution.getId());

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an academic year for an inactive institution");
        }

        String name = request.name().trim();

        if (academicYearRepository.existsByInstitution_IdAndNameIgnoreCase(
                institution.getId(), name)) {
            throw new DuplicateResourceException(
                    "Academic year name already exists in this institution");
        }

        AcademicYear year = new AcademicYear();
        year.setInstitution(institution);
        year.setName(name);
        year.setStartDate(request.startDate());
        year.setEndDate(request.endDate());
        year.setStatus(AcademicYearStatus.PLANNED);

        return academicYearRepository.save(year).getId();
    }

    @Transactional
    public UUID createClass(
            CreateSchoolClassRequest request,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository.findById(request.academicYearId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        requireInstitutionAccess(
                authentication, year.getInstitution().getId());

        if (year.getStatus() == AcademicYearStatus.CLOSED) {
            throw new BusinessRuleViolationException(
                    "Cannot add classes to a closed academic year");
        }

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setAcademicYear(year);
        schoolClass.setName(request.name().trim());
        schoolClass.setCode(request.code().trim().toUpperCase());
        schoolClass.setSortOrder(request.sortOrder());
        schoolClass.setActive(true);

        return schoolClassRepository.save(schoolClass).getId();
    }

    @Transactional
    public UUID createSection(
            CreateClassSectionRequest request,
            Authentication authentication
    ) {
        SchoolClass schoolClass = schoolClassRepository
                .findById(request.schoolClassId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Class not found"));

        AcademicYear year = schoolClass.getAcademicYear();
        UUID institutionId = year.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!schoolClass.isActive()
                || year.getStatus() == AcademicYearStatus.CLOSED) {
            throw new BusinessRuleViolationException(
                    "Cannot add a section to an inactive class or closed year");
        }

        Campus campus = null;

        if (request.campusId() != null) {
            campus = campusRepository.findById(request.campusId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Campus not found"));

            if (!campus.isActive()
                    || !campus.getInstitution().getId().equals(institutionId)) {
                throw new BusinessRuleViolationException(
                        "Campus must belong to the class's institution");
            }
        }

        ClassSection section = new ClassSection();
        section.setSchoolClass(schoolClass);
        section.setCampus(campus);
        section.setName(request.name().trim());
        section.setCapacity(request.capacity());
        section.setActive(true);

        return classSectionRepository.save(section).getId();
    }

    @Transactional
    public UUID enrollStudent(
            EnrollStudentRequest request,
            Authentication authentication
    ) {
        Student student = studentRepository
                .findByIdAndActiveTrue(request.studentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found"));

        ClassSection section = classSectionRepository
                .findById(request.sectionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Section not found"));

        AcademicYear year = section.getSchoolClass().getAcademicYear();
        UUID institutionId = year.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!section.isActive()
                || !section.getSchoolClass().isActive()
                || year.getStatus() != AcademicYearStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Enrollment requires an active section, class, and academic year");
        }

        if (!student.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Student and section must belong to the same institution");
        }

        if (request.startDate().isBefore(year.getStartDate())
                || request.startDate().isAfter(year.getEndDate())) {
            throw new BusinessRuleViolationException(
                    "Enrollment start date must fall within the academic year");
        }

        if (studentEnrollmentRepository.existsByStudent_IdAndStatus(
                student.getId(), EnrollmentStatus.ACTIVE)) {
            throw new DuplicateResourceException(
                    "Student already has an active enrollment");
        }

        StudentEnrollment enrollment = new StudentEnrollment();
        enrollment.setStudent(student);
        enrollment.setSection(section);
        enrollment.setStartDate(request.startDate());
        enrollment.setStatus(EnrollmentStatus.ACTIVE);

        return studentEnrollmentRepository.save(enrollment).getId();
    }

    @Transactional
    public UUID activateAcademicYear(
            UUID academicYearId,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository.findById(academicYearId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        UUID institutionId = year.getInstitution().getId();
        requireInstitutionAccess(authentication, institutionId);

        if (year.getStatus() != AcademicYearStatus.PLANNED) {
            throw new BusinessRuleViolationException(
                    "Only a planned academic year can be activated");
        }

        if (academicYearRepository.existsByInstitution_IdAndStatus(
                institutionId, AcademicYearStatus.ACTIVE)) {
            throw new BusinessRuleViolationException(
                    "This institution already has an active academic year");
        }

        year.setStatus(AcademicYearStatus.ACTIVE);
        academicYearRepository.save(year);

        return year.getId();
    }


    @Transactional(readOnly = true)
    public List<AcademicYearResponse> getAcademicYears(
            UUID institutionId,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return academicYearRepository
                .findByInstitution_IdOrderByStartDateDesc(institutionId)
                .stream()
                .map(year -> new AcademicYearResponse(
                        year.getId(),
                        year.getInstitution().getId(),
                        year.getName(),
                        year.getStartDate(),
                        year.getEndDate(),
                        year.getStatus()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SchoolClassResponse> getClasses(
            UUID academicYearId,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository.findById(academicYearId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        requireInstitutionAccess(authentication, year.getInstitution().getId());

        return schoolClassRepository
                .findByAcademicYear_IdAndActiveTrueOrderBySortOrderAsc(academicYearId)
                .stream()
                .map(schoolClass -> new SchoolClassResponse(
                        schoolClass.getId(),
                        year.getId(),
                        schoolClass.getName(),
                        schoolClass.getCode(),
                        schoolClass.getSortOrder(),
                        schoolClass.isActive()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassSectionResponse> getSections(
            UUID schoolClassId,
            Authentication authentication
    ) {
        SchoolClass schoolClass = schoolClassRepository.findById(schoolClassId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Class not found"));

        AcademicYear year = schoolClass.getAcademicYear();
        requireInstitutionAccess(authentication, year.getInstitution().getId());

        return classSectionRepository
                .findBySchoolClass_IdAndActiveTrueOrderByNameAsc(schoolClassId)
                .stream()
                .map(section -> new ClassSectionResponse(
                        section.getId(),
                        schoolClass.getId(),
                        section.getCampus() == null
                                ? null : section.getCampus().getId(),
                        section.getName(),
                        section.getCapacity(),
                        studentEnrollmentRepository.countBySection_IdAndStatus(
                                section.getId(), EnrollmentStatus.ACTIVE),
                        section.isActive()
                ))
                .toList();
    }


    @Transactional(readOnly = true)
    public List<StudentEnrollmentResponse> getStudentEnrollmentHistory(
            UUID studentId,
            Authentication authentication
    ) {
        Student student = studentRepository.findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        requireInstitutionAccess(authentication, student.getInstitution().getId());

        return studentEnrollmentRepository
                .findByStudent_IdOrderByStartDateDesc(studentId)
                .stream()
                .map(this::toEnrollmentResponse)
                .toList();
    }

    private StudentEnrollmentResponse toEnrollmentResponse(
            StudentEnrollment enrollment
    ) {
        ClassSection section = enrollment.getSection();
        SchoolClass schoolClass = section.getSchoolClass();
        AcademicYear year = schoolClass.getAcademicYear();
        Student student = enrollment.getStudent();

        return new StudentEnrollmentResponse(
                enrollment.getId(),
                student.getId(),
                student.getAdmissionNumber(),
                student.getFirstName() + " " + student.getLastName(),
                section.getId(),
                section.getName(),
                schoolClass.getId(),
                schoolClass.getName(),
                year.getId(),
                year.getName(),
                enrollment.getStartDate(),
                enrollment.getEndDate(),
                enrollment.getStatus()
        );
    }


    @Transactional
    public UUID completeEnrollment(
            UUID enrollmentId,
            EnrollmentEndRequest request,
            Authentication authentication
    ) {
        return endEnrollment(
                enrollmentId, request.endDate(),
                EnrollmentStatus.COMPLETED, authentication);
    }

    @Transactional
    public UUID withdrawStudent(
            UUID enrollmentId,
            EnrollmentEndRequest request,
            Authentication authentication
    ) {
        return endEnrollment(
                enrollmentId, request.endDate(),
                EnrollmentStatus.WITHDRAWN, authentication);
    }

    private UUID endEnrollment(
            UUID enrollmentId,
            LocalDate endDate,
            EnrollmentStatus newStatus,
            Authentication authentication
    ) {
        StudentEnrollment enrollment =
                studentEnrollmentRepository.findById(enrollmentId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student enrollment not found"));

        AcademicYear year = enrollment.getSection()
                .getSchoolClass().getAcademicYear();

        requireInstitutionAccess(
                authentication, year.getInstitution().getId());

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Only active enrollments can be completed or withdrawn");
        }

        if (endDate.isBefore(enrollment.getStartDate())) {
            throw new BusinessRuleViolationException(
                    "End date cannot be before the enrollment start date");
        }

        if (endDate.isAfter(year.getEndDate())) {
            throw new BusinessRuleViolationException(
                    "End date cannot be after the academic year end date");
        }

        enrollment.setEndDate(endDate);
        enrollment.setStatus(newStatus);

        return studentEnrollmentRepository.save(enrollment).getId();
    }


    @Transactional
    public UUID transferStudent(
            UUID currentEnrollmentId,
            TransferStudentRequest request,
            Authentication authentication
    ) {
        StudentEnrollment current =
                studentEnrollmentRepository.findById(currentEnrollmentId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Current enrollment not found"));

        AcademicYear currentYear = current.getSection()
                .getSchoolClass().getAcademicYear();

        requireInstitutionAccess(
                authentication, currentYear.getInstitution().getId());

        if (current.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Only an actively enrolled student can be transferred");
        }

        ClassSection target = classSectionRepository
                .findById(request.targetSectionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Target section not found"));

        SchoolClass targetClass = target.getSchoolClass();
        AcademicYear targetYear = targetClass.getAcademicYear();

        requireInstitutionAccess(
                authentication, targetYear.getInstitution().getId());

        if (!current.getStudent().getInstitution().getId()
                .equals(targetYear.getInstitution().getId())) {
            throw new BusinessRuleViolationException(
                    "Student cannot be transferred to another institution "
                            + "using this operation");
        }

        if (!target.isActive() || !targetClass.isActive()
                || targetYear.getStatus() != AcademicYearStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Target section must belong to an active academic year "
                            + "and be active");
        }

        LocalDate transferDate = request.effectiveDate();

        if (transferDate.isBefore(current.getStartDate())
                || transferDate.isAfter(currentYear.getEndDate())
                || transferDate.isBefore(targetYear.getStartDate())
                || transferDate.isAfter(targetYear.getEndDate())) {
            throw new BusinessRuleViolationException(
                    "Transfer date must fall within both academic years "
                            + "and cannot precede the current enrollment");
        }

        if (current.getSection().getId().equals(target.getId())) {
            throw new BusinessRuleViolationException(
                    "Student is already enrolled in this section");
        }

        validateSectionCapacity(target);

        // End the old enrollment before inserting the new one.
        current.setEndDate(transferDate);
        current.setStatus(EnrollmentStatus.COMPLETED);
        studentEnrollmentRepository.saveAndFlush(current);

        StudentEnrollment next = new StudentEnrollment();
        next.setStudent(current.getStudent());
        next.setSection(target);
        next.setStartDate(transferDate);
        next.setStatus(EnrollmentStatus.ACTIVE);

        return studentEnrollmentRepository.save(next).getId();
    }

    private void validateSectionCapacity(ClassSection section) {
        Integer capacity = section.getCapacity();

        if (capacity == null) {
            return; // No configured capacity limit.
        }

        long enrolled = studentEnrollmentRepository
                .countBySection_IdAndStatus(
                        section.getId(), EnrollmentStatus.ACTIVE);

        if (enrolled >= capacity) {
            throw new BusinessRuleViolationException(
                    "The target section has reached its capacity");
        }
    }


    @Transactional
    public UUID closeAcademicYear(
            UUID academicYearId,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository.findById(academicYearId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        requireInstitutionAccess(
                authentication, year.getInstitution().getId());

        if (year.getStatus() != AcademicYearStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Only an active academic year can be closed");
        }

        boolean hasActiveEnrollments =
                studentEnrollmentRepository
                        .existsBySection_SchoolClass_AcademicYear_IdAndStatus(
                                academicYearId, EnrollmentStatus.ACTIVE);

        if (hasActiveEnrollments) {
            throw new BusinessRuleViolationException(
                    "Complete or withdraw all active enrollments "
                            + "before closing the academic year");
        }

        year.setStatus(AcademicYearStatus.CLOSED);
        return academicYearRepository.save(year).getId();
    }


    @Transactional(readOnly = true)
    public Page<StudentEnrollmentResponse> getSectionRoster(
            UUID sectionId,
            Pageable pageable,
            Authentication authentication
    ) {
        ClassSection section = classSectionRepository.findById(sectionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Section not found"));

        AcademicYear year = section.getSchoolClass()
                .getAcademicYear();

        requireInstitutionAccess(
                authentication, year.getInstitution().getId());

        if (pageable.getPageSize() > 100) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed 100");
        }

        return studentEnrollmentRepository.findBySection_IdAndStatus(
                        sectionId, EnrollmentStatus.ACTIVE, pageable)
                .map(this::toEnrollmentResponse);
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
}