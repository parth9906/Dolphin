
package com.school.dolphin.assessment.service;

import com.school.dolphin.academic.repository.SchoolClassRepository;
import com.school.dolphin.assessment.dto.*;
import com.school.dolphin.assessment.entity.Assessment;
import com.school.dolphin.assessment.entity.StudentMark;
import com.school.dolphin.assessment.entity.StudentMarkAudit;
import com.school.dolphin.assessment.repository.AssessmentRepository;
import com.school.dolphin.assessment.repository.StudentMarkAuditRepository;
import com.school.dolphin.assessment.repository.StudentMarkRepository;
import com.school.dolphin.academic.entity.ClassSection;
import com.school.dolphin.academic.repository.ClassSectionRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import com.school.dolphin.student.service.StudentSectionResolver;
import com.school.dolphin.timetable.service.TeacherSectionAuthorization;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.school.dolphin.assessment.entity.AssessmentScope;
import com.school.dolphin.academic.entity.SchoolClass;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final StudentMarkRepository studentMarkRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final StudentMarkAuditRepository studentMarkAuditRepository;
    private final TeacherSectionAuthorization teacherSectionAuthorization;
    private final StudentSectionResolver studentSectionResolver;
    private final ClassSectionRepository classSectionRepository;
    private final SchoolClassRepository schoolClassRepository;

    @Transactional
    public AssessmentResponse createAssessment(
            CreateAssessmentRequest request,
            Authentication authentication) {

        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an assessment for an inactive institution.");
        }

        requireInstitutionAccess(authentication, institution.getId());

        UserAccount creator = getAuthenticatedAccount(authentication);

        validateScopeTarget(
                request.scopeType(),
                request.schoolClassId(),
                request.sectionId());

        SchoolClass schoolClass = null;
        ClassSection section = null;

        if (request.scopeType() == AssessmentScope.CLASS) {
            schoolClass = requireActiveClassInInstitution(
                    request.schoolClassId(), institution.getId());
        } else if (request.scopeType() == AssessmentScope.SECTION) {
            section = resolveAssessmentSection(
                    request.sectionId(), institution.getId());

            if (!section.getSchoolClass().isActive()) {
                throw new BusinessRuleViolationException(
                        "Cannot create an assessment for an inactive class.");
            }
        }

        Assessment assessment = Assessment.builder()
                .institution(institution)
                .scopeType(request.scopeType())
                .schoolClass(schoolClass)
                .section(section)
                .name(request.name().trim())
                .subjectName(request.subjectName().trim())
                .assessmentDate(request.assessmentDate())
                .maxMarks(request.maxMarks())
                .active(true)
                .createdBy(creator)
                .build();

        return toAssessmentResponse(assessmentRepository.save(assessment));
    }

    @Transactional(readOnly = true)
    public Page<AssessmentResponse> searchAssessments(
            UUID institutionId,
            UUID sectionId,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable,
            Authentication authentication
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessRuleViolationException(
                    "fromDate must not be after toDate");
        }

        if (scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            if (sectionId != null) {
                requireSectionInInstitution(sectionId, institutionId);
            }

            return assessmentRepository
                    .search(institutionId, sectionId, fromDate, toDate, pageable)
                    .map(this::toAssessmentResponse);
        }

        Set<UUID> allowedSectionIds = teacherSectionAuthorization
                .findCurrentTeachingSectionIds(
                        authentication, institutionId, LocalDate.now());

        if (allowedSectionIds.isEmpty()) {
            throw new AccessDeniedException(
                    "You do not have access to assessments in this institution");
        }

        if (sectionId != null) {
            if (!allowedSectionIds.contains(sectionId)) {
                throw new AccessDeniedException(
                        "You are not authorized to read assessments for this section");
            }
        }

        return assessmentRepository
                .searchAccessibleToSections(
                        institutionId,
                        sectionId == null
                                ? allowedSectionIds
                                : Set.of(sectionId),
                        fromDate,
                        toDate,
                        pageable)
                .map(this::toAssessmentResponse);
    }

    @Transactional
    public List<StudentMarkResponse> recordMarks(
            UUID assessmentId,
            RecordMarksRequest request,
            Authentication authentication) {

        Assessment assessment = assessmentRepository
                .findByIdAndActiveTrue(assessmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assessment not found"));

        UUID institutionId = assessment.getInstitution().getId();
        LocalDate onDate = assessment.getAssessmentDate();

        Optional<Set<UUID>> restriction = resolveSectionRestriction(
                authentication, institutionId, onDate);

        List<RecordMarksRequest.MarkEntry> entries = request.records();

        Set<UUID> studentIds = new HashSet<>();
        for (var entry : entries) {
            if (!studentIds.add(entry.studentId())) {
                throw new BusinessRuleViolationException(
                        "A student appears more than once in this request.");
            }

            if (entry.marksObtained().compareTo(BigDecimal.ZERO) < 0
                    || entry.marksObtained().compareTo(
                    assessment.getMaxMarks()) > 0) {
                throw new BusinessRuleViolationException(
                        "Marks must be between 0 and "
                                + assessment.getMaxMarks() + ".");
            }
        }

        List<Student> students =
                studentRepository.findByIdInAndInstitution_IdAndActiveTrue(
                        studentIds, institutionId);

        if (students.size() != studentIds.size()) {
            throw new BusinessRuleViolationException(
                    "Every student must be active and belong to the assessment institution.");
        }

        requireStudentsEligibleForAssessment(
                studentIds, assessment, onDate);

        restriction.ifPresent(allowedSectionIds -> {
            requireAssessmentTeacherAccess(assessment, allowedSectionIds);

            requireStudentsInTeachingSections(
                    studentIds, allowedSectionIds, onDate);
        });

        for (UUID studentId : studentIds) {
            if (studentMarkRepository.existsByAssessment_IdAndStudent_Id(
                    assessmentId, studentId)) {
                throw new DuplicateResourceException(
                        "Marks already exist for student " + studentId);
            }
        }

        UserAccount marker = getAuthenticatedAccount(authentication);

        var entriesByStudent = entries.stream().collect(
                Collectors.toMap(
                        RecordMarksRequest.MarkEntry::studentId,
                        entry -> entry
                ));

        List<StudentMark> marks = students.stream()
                .map(student -> {
                    var entry = entriesByStudent.get(student.getId());

                    return StudentMark.builder()
                            .assessment(assessment)
                            .student(student)
                            .marksObtained(entry.marksObtained())
                            .remarks(normalizeRemarks(entry.remarks()))
                            .markedBy(marker)
                            .build();
                })
                .toList();

        return studentMarkRepository.saveAll(marks).stream()
                .map(this::toMarkResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMarkResponse> getAssessmentResults(
            UUID assessmentId,
            Authentication authentication) {

        Assessment assessment = assessmentRepository
                .findByIdAndActiveTrue(assessmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assessment not found"));

        UUID institutionId = assessment.getInstitution().getId();
        LocalDate onDate = assessment.getAssessmentDate();

        List<StudentMark> marks = studentMarkRepository
                .findByAssessment_IdOrderByStudent_FirstNameAsc(assessmentId);

        Optional<Set<UUID>> restriction = resolveSectionRestriction(
                authentication, institutionId, onDate);

        if (restriction.isEmpty()) {
            return marks.stream().map(this::toMarkResponse).toList();
        }

        Set<UUID> allowedSectionIds = restriction.get();

        requireAssessmentTeacherAccess(assessment, allowedSectionIds);

        Map<UUID, Set<UUID>> sectionsByStudent =
                studentSectionResolver.findActiveSectionIds(
                        marks.stream()
                                .map(mark -> mark.getStudent().getId())
                                .collect(Collectors.toSet()),
                        onDate);

        return marks.stream()
                .filter(mark -> sectionsByStudent
                        .getOrDefault(mark.getStudent().getId(), Set.of())
                        .stream()
                        .anyMatch(allowedSectionIds::contains))
                .map(this::toMarkResponse)
                .toList();
    }


    @Transactional
    public StudentMarkResponse updateStudentMark(
            UUID markId,
            UpdateStudentMarkRequest request,
            Authentication authentication) {

        StudentMark mark = studentMarkRepository.findById(markId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student mark not found"));

        Assessment assessment = mark.getAssessment();

        requireStudentMarkAccess(authentication, assessment, mark);

        if (!assessment.isActive()) {
            throw new BusinessRuleViolationException(
                    "Marks cannot be changed for an inactive assessment.");
        }

        BigDecimal newMarks = request.marksObtained();

        if (newMarks.compareTo(BigDecimal.ZERO) < 0
                || newMarks.compareTo(assessment.getMaxMarks()) > 0) {
            throw new BusinessRuleViolationException(
                    "Marks must be between 0 and "
                            + assessment.getMaxMarks() + ".");
        }

        if (!mark.getVersion().equals(request.version())) {
            throw new StaleResourceVersionException(
                    "This mark was updated by someone else. "
                            + "Reload the latest mark before making changes."
            );
        }

        BigDecimal previousMarks = mark.getMarksObtained();
        String previousRemarks = mark.getRemarks();

        String newRemarks = normalizeRemarks(request.remarks());

        // Avoid creating audit noise when nothing actually changed.
        if (previousMarks.compareTo(newMarks) == 0
                && java.util.Objects.equals(previousRemarks, newRemarks)) {
            return toMarkResponse(mark);
        }

        UserAccount changedBy = getAuthenticatedAccount(authentication);

        mark.setMarksObtained(newMarks);
        mark.setRemarks(newRemarks);

        StudentMark savedMark = studentMarkRepository.saveAndFlush(mark);

        StudentMarkAudit audit = StudentMarkAudit.builder()
                .studentMark(savedMark)
                .action("UPDATED")
                .previousMarks(previousMarks)
                .newMarks(newMarks)
                .previousRemarks(previousRemarks)
                .newRemarks(newRemarks)
                .changedBy(changedBy)
                .build();

        studentMarkAuditRepository.save(audit);

        return toMarkResponse(savedMark);
    }


    @Transactional(readOnly = true)
    public List<StudentMarkAuditResponse> getStudentMarkAudit(
            UUID markId,
            Authentication authentication) {

        StudentMark mark = studentMarkRepository.findById(markId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student mark not found"));

        Assessment assessment = mark.getAssessment();

        requireStudentMarkAccess(authentication, assessment, mark);

        return studentMarkAuditRepository
                .findByStudentMark_IdOrderByChangedAtDesc(markId)
                .stream()
                .map(audit -> new StudentMarkAuditResponse(
                        audit.getId(),
                        audit.getStudentMark().getId(),
                        audit.getPreviousMarks(),
                        audit.getNewMarks(),
                        audit.getPreviousRemarks(),
                        audit.getNewRemarks(),
                        audit.getChangedBy().getId(),
                        audit.getChangedAt()
                ))
                .toList();
    }

    @Transactional
    public AssessmentResponse updateAssessment(
            UUID assessmentId,
            UpdateAssessmentRequest request,
            Authentication authentication) {

        Assessment assessment = assessmentRepository
                .findByIdAndActiveTrue(assessmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assessment not found"));

        UUID institutionId = assessment.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        validateScopeTarget(
                request.scopeType(),
                request.schoolClassId(),
                request.sectionId());

        SchoolClass schoolClass = null;
        ClassSection section = null;

        if (request.scopeType() == AssessmentScope.CLASS) {
            schoolClass = requireActiveClassInInstitution(
                    request.schoolClassId(), institutionId);
        } else if (request.scopeType() == AssessmentScope.SECTION) {
            section = resolveAssessmentSection(
                    request.sectionId(), institutionId);

            if (!section.getSchoolClass().isActive()) {
                throw new BusinessRuleViolationException(
                        "Cannot use an inactive school class.");
            }
        }

        BigDecimal highestRecordedMark =
                assessmentRepository.findHighestRecordedMark(assessmentId);

        boolean marksExist = highestRecordedMark != null;

        if (marksExist) {
            boolean scopeChanged =
                    assessment.getScopeType() != request.scopeType()
                            || !java.util.Objects.equals(
                            assessment.getSchoolClass() == null
                                    ? null : assessment.getSchoolClass().getId(),
                            request.schoolClassId())
                            || !java.util.Objects.equals(
                            assessment.getSection() == null
                                    ? null : assessment.getSection().getId(),
                            request.sectionId());

            boolean dateChanged = !assessment.getAssessmentDate()
                    .equals(request.assessmentDate());

            if (scopeChanged || dateChanged) {
                throw new BusinessRuleViolationException(
                        "Assessment scope and date cannot be changed after marks have been recorded.");
            }

            if (request.maxMarks().compareTo(highestRecordedMark) < 0) {
                throw new BusinessRuleViolationException(
                        "Maximum marks cannot be lower than the highest recorded mark: "
                                + highestRecordedMark);
            }
        }

        assessment.setScopeType(request.scopeType());
        assessment.setSchoolClass(schoolClass);
        assessment.setSection(section);
        assessment.setName(request.name().trim());
        assessment.setSubjectName(request.subjectName().trim());
        assessment.setAssessmentDate(request.assessmentDate());
        assessment.setMaxMarks(request.maxMarks());

        return toAssessmentResponse(
                assessmentRepository.save(assessment));
    }


    @Transactional(readOnly = true)
    public Page<AssessmentRosterItem> getAssessmentRoster(
            UUID assessmentId,
            Pageable pageable,
            Authentication authentication) {

        Assessment assessment = assessmentRepository
                .findByIdAndActiveTrue(assessmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Assessment not found"));

        UUID institutionId = assessment.getInstitution().getId();

        Optional<Set<UUID>> restriction = resolveSectionRestriction(
                authentication,
                institutionId,
                assessment.getAssessmentDate());

        // Institution-level access: return the complete eligible roster.
        if (restriction.isEmpty()) {
            return studentMarkRepository.findAssessmentRoster(
                    assessmentId, pageable);
        }

        // Teacher access: validate assessment scope and teaching authorization.
        Set<UUID> allowedSectionIds = restriction.get();

        requireAssessmentTeacherAccess(
                assessment, allowedSectionIds);

        // The repository limits the roster to authorized sections and
        // applies the assessment's own scope and eligibility conditions.
        return studentMarkRepository.findAssessmentRosterForSections(
                assessmentId,
                allowedSectionIds,
                pageable);
    }


    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    /**
     * Empty when the caller has institution-level access (the approved
     * administrator bypass). Otherwise the caller must be a teacher and the
     * marks are limited to the sections they are assigned to teach on the
     * assessment date.
     */
    private Optional<Set<UUID>> resolveSectionRestriction(
            Authentication authentication,
            UUID institutionId,
            LocalDate onDate
    ) {
        if (scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            return Optional.empty();
        }

        return Optional.of(
                teacherSectionAuthorization.findCurrentTeachingSectionIds(
                        authentication, institutionId, onDate));
    }

    private void requireStudentsInTeachingSections(
            Collection<UUID> studentIds,
            Set<UUID> allowedSectionIds,
            LocalDate onDate
    ) {
        if (allowedSectionIds.isEmpty()) {
            throw new AccessDeniedException(
                    "You are not authorized to access marks for this assessment");
        }

        Map<UUID, Set<UUID>> sectionsByStudent =
                studentSectionResolver.findActiveSectionIds(studentIds, onDate);

        for (UUID studentId : studentIds) {
            if (sectionsByStudent.getOrDefault(studentId, Set.of())
                    .stream()
                    .noneMatch(allowedSectionIds::contains)) {
                throw new AccessDeniedException(
                        "You are not authorized to access marks for student "
                                + studentId);
            }
        }
    }


    /**
     * A section-scoped assessment may only hold marks for students who were
     * enrolled in that section on the assessment date.
     */
    private void requireStudentsInSection(
            Collection<UUID> studentIds,
            UUID sectionId,
            LocalDate onDate
    ) {
        Map<UUID, Set<UUID>> sectionsByStudent =
                studentSectionResolver.findActiveSectionIds(studentIds, onDate);

        for (UUID studentId : studentIds) {
            if (!sectionsByStudent
                    .getOrDefault(studentId, Set.of())
                    .contains(sectionId)) {
                throw new BusinessRuleViolationException(
                        "Student " + studentId
                                + " is not enrolled in the assessment section "
                                + "on the assessment date");
            }
        }
    }


    private void requireStudentMarkAccess(
            Authentication authentication,
            Assessment assessment,
            StudentMark mark) {

        UUID institutionId = assessment.getInstitution().getId();
        LocalDate onDate = assessment.getAssessmentDate();
        UUID studentId = mark.getStudent().getId();

        requireStudentsEligibleForAssessment(
                List.of(studentId), assessment, onDate);

        Optional<Set<UUID>> restriction = resolveSectionRestriction(
                authentication, institutionId, onDate);

        if (restriction.isEmpty()) {
            return;
        }

        Set<UUID> allowedSectionIds = restriction.get();

        requireAssessmentTeacherAccess(assessment, allowedSectionIds);

        requireStudentsInTeachingSections(
                List.of(studentId), allowedSectionIds, onDate);
    }


    private UserAccount getAuthenticatedAccount(
            Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal()
                instanceof AuthenticatedUser user)) {
            throw new AccessDeniedException("Authenticated user is required.");
        }

        return userAccountRepository.findById(user.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User account not found"));
    }

    private String normalizeRemarks(String remarks) {
        return remarks == null || remarks.isBlank()
                ? null : remarks.trim();
    }

    private AssessmentResponse toAssessmentResponse(Assessment assessment) {
        return new AssessmentResponse(
                assessment.getId(),
                assessment.getInstitution().getId(),
                assessment.getScopeType(),
                assessment.getSchoolClass() == null
                        ? null : assessment.getSchoolClass().getId(),
                assessment.getSection() == null
                        ? null : assessment.getSection().getId(),
                assessment.getName(),
                assessment.getSubjectName(),
                assessment.getAssessmentDate(),
                assessment.getMaxMarks(),
                assessment.isActive()
        );
    }

    private ClassSection resolveAssessmentSection(
            UUID sectionId,
            UUID institutionId
    ) {
        if (sectionId == null) {
            return null;
        }

        ClassSection section = requireSectionInInstitution(
                sectionId, institutionId);

        if (!section.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot create an assessment for an inactive section");
        }

        return section;
    }

    private ClassSection requireSectionInInstitution(
            UUID sectionId,
            UUID institutionId
    ) {
        ClassSection section = classSectionRepository.findById(sectionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Class section not found"));

        UUID sectionInstitutionId = section.getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        if (!institutionId.equals(sectionInstitutionId)) {
            throw new BusinessRuleViolationException(
                    "Class section does not belong to the requested institution");
        }

        return section;
    }

    private StudentMarkResponse toMarkResponse(StudentMark mark) {
        Student student = mark.getStudent();

        return new StudentMarkResponse(
                mark.getId(),
                mark.getAssessment().getId(),
                student.getId(),
                student.getAdmissionNumber(),
                student.getFirstName(),
                student.getLastName(),
                mark.getMarksObtained(),
                mark.getAssessment().getMaxMarks(),
                mark.getRemarks(),
                mark.getVersion()
        );
    }

    private void validateScopeTarget(
            AssessmentScope scopeType,
            UUID schoolClassId,
            UUID sectionId) {

        if (scopeType == null) {
            throw new BusinessRuleViolationException(
                    "Assessment scope is required.");
        }

        boolean valid = switch (scopeType) {
            case INSTITUTION ->
                    schoolClassId == null && sectionId == null;
            case CLASS ->
                    schoolClassId != null && sectionId == null;
            case SECTION ->
                    schoolClassId == null && sectionId != null;
        };

        if (!valid) {
            throw new BusinessRuleViolationException(
                    "Provide exactly the target required by the assessment scope.");
        }
    }

    private SchoolClass requireActiveClassInInstitution(
            UUID schoolClassId,
            UUID institutionId) {

        SchoolClass schoolClass = schoolClassRepository.findById(schoolClassId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("School class not found"));

        UUID classInstitutionId = schoolClass.getAcademicYear()
                .getInstitution()
                .getId();

        if (!institutionId.equals(classInstitutionId)) {
            throw new BusinessRuleViolationException(
                    "School class does not belong to the requested institution.");
        }

        if (!schoolClass.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot use an inactive school class.");
        }

        return schoolClass;
    }


    private void requireStudentsEligibleForAssessment(
            Collection<UUID> studentIds,
            Assessment assessment,
            LocalDate onDate) {

        Map<UUID, Set<UUID>> sectionsByStudent =
                studentSectionResolver.findActiveSectionIds(studentIds, onDate);

        for (UUID studentId : studentIds) {
            Set<UUID> enrolledSectionIds =
                    sectionsByStudent.getOrDefault(studentId, Set.of());

            boolean eligible = switch (assessment.getScopeType()) {
                case INSTITUTION -> !enrolledSectionIds.isEmpty();

                case CLASS -> enrolledSectionIds.stream().anyMatch(sectionId ->
                        classSectionRepository.findById(sectionId)
                                .map(section -> section.getSchoolClass().getId()
                                        .equals(assessment.getSchoolClass().getId()))
                                .orElse(false));

                case SECTION -> enrolledSectionIds.contains(
                        assessment.getSection().getId());
            };

            if (!eligible) {
                throw new BusinessRuleViolationException(
                        "Student " + studentId
                                + " is not eligible for this assessment on "
                                + onDate + ".");
            }
        }
    }


    private void requireAssessmentTeacherAccess(
            Assessment assessment,
            Set<UUID> allowedSectionIds) {

        if (allowedSectionIds.isEmpty()) {
            throw new AccessDeniedException(
                    "You are not authorized to access this assessment.");
        }

        switch (assessment.getScopeType()) {

            case INSTITUTION -> {
                // Institution-wide assessment scope does not grant
                // access to every student.
                //
                // The calling operation must still restrict individual
                // students to the teacher's authorized sections.
            }

            case SECTION -> {
                UUID assessmentSectionId =
                        assessment.getSection().getId();

                if (!allowedSectionIds.contains(assessmentSectionId)) {
                    throw new AccessDeniedException(
                            "You are not authorized for this assessment section.");
                }
            }

            case CLASS -> {
                UUID assessmentClassId =
                        assessment.getSchoolClass().getId();

                boolean teachesClass = classSectionRepository
                        .findBySchoolClass_IdAndActiveTrueOrderByNameAsc(
                                assessmentClassId)
                        .stream()
                        .anyMatch(section ->
                                allowedSectionIds.contains(section.getId()));

                if (!teachesClass) {
                    throw new AccessDeniedException(
                            "You are not authorized for this assessment class.");
                }
            }
        }
    }


}
