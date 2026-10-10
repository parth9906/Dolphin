
package com.school.dolphin.assessment.service;

import com.school.dolphin.assessment.dto.*;
import com.school.dolphin.assessment.entity.Assessment;
import com.school.dolphin.assessment.entity.StudentMark;
import com.school.dolphin.assessment.entity.StudentMarkAudit;
import com.school.dolphin.assessment.repository.AssessmentRepository;
import com.school.dolphin.assessment.repository.StudentMarkAuditRepository;
import com.school.dolphin.assessment.repository.StudentMarkRepository;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final StudentMarkRepository studentMarkRepository;
    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final StudentMarkAuditRepository studentMarkAuditRepository;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            StudentMarkRepository studentMarkRepository,
            StudentRepository studentRepository,
            InstitutionRepository institutionRepository,
            UserAccountRepository userAccountRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            StudentMarkAuditRepository studentMarkAuditRepository) {
        this.assessmentRepository = assessmentRepository;
        this.studentMarkRepository = studentMarkRepository;
        this.studentRepository = studentRepository;
        this.institutionRepository = institutionRepository;
        this.userAccountRepository = userAccountRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.studentMarkAuditRepository = studentMarkAuditRepository;
    }

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

        Assessment assessment = Assessment.builder()
                .institution(institution)
                .name(request.name().trim())
                .subjectName(request.subjectName().trim())
                .assessmentDate(request.assessmentDate())
                .maxMarks(request.maxMarks())
                .active(true)
                .createdBy(creator)
                .build();

        return toAssessmentResponse(assessmentRepository.save(assessment));
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

        requireInstitutionAccess(
                authentication, assessment.getInstitution().getId());

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
                        studentIds, assessment.getInstitution().getId());

        if (students.size() != studentIds.size()) {
            throw new BusinessRuleViolationException(
                    "Every student must be active and belong to the assessment institution.");
        }

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

        requireInstitutionAccess(
                authentication, assessment.getInstitution().getId());

        return studentMarkRepository
                .findByAssessment_IdOrderByStudent_FirstNameAsc(assessmentId)
                .stream()
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

        requireInstitutionAccess(
                authentication,
                assessment.getInstitution().getId()
        );

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

        requireInstitutionAccess(
                authentication,
                mark.getAssessment().getInstitution().getId()
        );

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

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
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
                assessment.getName(),
                assessment.getSubjectName(),
                assessment.getAssessmentDate(),
                assessment.getMaxMarks(),
                assessment.isActive()
        );
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
}