
package com.school.dolphin.homework.service;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.entity.StudentEnrollment;
import com.school.dolphin.academic.repository.StudentEnrollmentRepository;
import com.school.dolphin.homework.dto.AssignmentResponse;
import com.school.dolphin.homework.dto.AssignmentSubmissionResponse;
import com.school.dolphin.homework.dto.SubmitAssignmentRequest;
import com.school.dolphin.homework.entity.Assignment;
import com.school.dolphin.homework.entity.AssignmentStatus;
import com.school.dolphin.homework.entity.AssignmentSubmission;
import com.school.dolphin.homework.entity.AssignmentSubmissionStatus;
import com.school.dolphin.homework.repository.AssignmentRepository;
import com.school.dolphin.homework.repository.AssignmentSubmissionRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentAccountLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final StudentAccountLinkRepository studentAccountLinkRepository;
    private final UserAccountRepository userAccountRepository;

    @Transactional(readOnly = true)
    public Page<AssignmentResponse> listAvailableAssignments(
            Authentication authentication,
            Pageable pageable
    ) {
        Student student = getCurrentStudent(authentication);
        ensureStudentActive(student);

        LocalDate today = LocalDate.now();

        List<UUID> sectionIds = enrollmentRepository
                .findByStudent_IdAndStatus(
                        student.getId(), EnrollmentStatus.ACTIVE)
                .stream()
                .filter(enrollment ->
                        !enrollment.getStartDate().isAfter(today))
                .filter(enrollment ->
                        enrollment.getEndDate() == null
                                || !enrollment.getEndDate().isBefore(today))
                .map(enrollment -> enrollment.getSection().getId())
                .distinct()
                .toList();

        if (sectionIds.isEmpty()) {
            return Page.empty(pageable);
        }

        return assignmentRepository
                .findBySection_IdInAndStatus(
                        sectionIds, AssignmentStatus.PUBLISHED, pageable)
                .map(AssignmentResponse::from);
    }

    @Transactional
    public AssignmentSubmissionResponse submit(
            UUID assignmentId,
            SubmitAssignmentRequest request,
            Authentication authentication
    ) {
        Student student = getCurrentStudent(authentication);
        ensureStudentActive(student);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Assignment not found"));

        if (assignment.getStatus() != AssignmentStatus.PUBLISHED) {
            throw new IllegalArgumentException(
                    "Only published assignments can be submitted");
        }

        ensureCurrentlyEnrolled(student, assignment);

        String text = request.submissionText().trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException(
                    "Submission text cannot be blank");
        }

        OffsetDateTime now = OffsetDateTime.now();

        AssignmentSubmission submission = submissionRepository
                .findByAssignment_IdAndStudent_Id(
                        assignmentId, student.getId())
                .orElseGet(() -> {
                    AssignmentSubmission created =
                            new AssignmentSubmission();
                    created.setAssignment(assignment);
                    created.setStudent(student);
                    return created;
                });

        if (submission.getStatus() == AssignmentSubmissionStatus.GRADED) {
            throw new IllegalArgumentException(
                    "A graded submission cannot be resubmitted");
        }

        submission.setSubmissionText(text);
        submission.setSubmittedAt(now);
        submission.setStatus(
                now.isAfter(assignment.getDueAt())
                        ? AssignmentSubmissionStatus.LATE
                        : AssignmentSubmissionStatus.SUBMITTED
        );

        try {
            return AssignmentSubmissionResponse.from(
                    submissionRepository.saveAndFlush(submission));
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Submission conflicted with another request. Please retry.");
        }
    }

    @Transactional(readOnly = true)
    public AssignmentSubmissionResponse getMySubmission(
            UUID assignmentId,
            Authentication authentication
    ) {
        Student student = getCurrentStudent(authentication);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Assignment not found"));

        ensureCurrentlyEnrolled(student, assignment);

        AssignmentSubmission submission = submissionRepository
                .findByAssignment_IdAndStudent_Id(
                        assignmentId, student.getId())
                .orElseThrow(() ->
                        new EntityNotFoundException("Submission not found"));

        return AssignmentSubmissionResponse.from(submission);
    }

    private Student getCurrentStudent(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        UserAccount user = userAccountRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new EntityNotFoundException("Current user not found"));

        return studentAccountLinkRepository
                .findByUserAccount_Id(user.getId())
                .map(link -> link.getStudent())
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "No student profile is linked to this account"));
    }

    private void ensureStudentActive(Student student) {
        if (!student.isActive()) {
            throw new AccessDeniedException(
                    "Inactive students cannot access assignments");
        }
    }

    private void ensureCurrentlyEnrolled(
            Student student,
            Assignment assignment
    ) {
        LocalDate today = LocalDate.now();

        boolean enrolled = enrollmentRepository
                .findByStudent_IdAndStatus(
                        student.getId(), EnrollmentStatus.ACTIVE)
                .stream()
                .anyMatch(enrollment ->
                        enrollment.getSection().getId()
                                .equals(assignment.getSection().getId())
                                && !enrollment.getStartDate().isAfter(today)
                                && (enrollment.getEndDate() == null
                                || !enrollment.getEndDate().isBefore(today)));

        if (!enrolled) {
            throw new AccessDeniedException(
                    "You are not currently enrolled in this assignment's section");
        }
    }
}
