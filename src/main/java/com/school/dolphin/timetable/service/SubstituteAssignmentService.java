package com.school.dolphin.timetable.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.school.dolphin.academic.repository.TeacherSubjectAssignmentRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.timetable.dto.LessonSubstituteAuditResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.leave.entity.LeaveRequestStatus;
import com.school.dolphin.leave.repository.StaffLeaveRequestRepository;
import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;
import com.school.dolphin.timetable.dto.AssignSubstituteRequest;
import com.school.dolphin.timetable.dto.SubstituteAssignmentResponse;
import com.school.dolphin.timetable.entity.LessonOccurrence;
import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;
import com.school.dolphin.timetable.entity.LessonSubstituteAudit;
import com.school.dolphin.timetable.repository.LessonOccurrenceRepository;
import com.school.dolphin.timetable.repository.LessonSubstituteAuditRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubstituteAssignmentService {

    private final LessonOccurrenceRepository occurrenceRepository;
    private final LessonSubstituteAuditRepository auditRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;
    private final StaffLeaveRequestRepository staffLeaveRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationScopeAuthorization organizationScopeAuthorization;

    @Transactional
    public SubstituteAssignmentResponse assign(
            UUID occurrenceId,
            AssignSubstituteRequest request,
            Authentication authentication) {

        LessonOccurrence occurrence = occurrenceRepository
                .findByIdForUpdate(occurrenceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson occurrence not found"));

        var lesson = occurrence.getScheduledLesson();

        UUID institutionId = lesson.getSection()
                .getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        if (occurrence.getStatus() != LessonOccurrenceStatus.NEEDS_COVERAGE
                && occurrence.getStatus()
                != LessonOccurrenceStatus.COVERAGE_ASSIGNED) {
            throw new BusinessRuleViolationException(
                    "The lesson must need coverage before a substitute can be assigned");
        }

        StaffAssignment substitute = staffAssignmentRepository
                .findByIdAndInstitution_IdAndStatus(
                        request.substituteStaffAssignmentId(),
                        institutionId,
                        StaffAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Active substitute assignment not found at this institution"));

        UUID originalTeacherId = lesson.getTeacherAssignment().getId();

        if (originalTeacherId.equals(substitute.getId())) {
            throw new BusinessRuleViolationException(
                    "The original teacher cannot be assigned as their own substitute");
        }

        boolean qualified = teacherSubjectAssignmentRepository
                .existsByStaffAssignment_IdAndSubject_IdAndActiveTrue(
                        substitute.getId(),
                        lesson.getSubject().getId());

        if (!qualified) {
            throw new BusinessRuleViolationException(
                    "The substitute must have an active assignment to this subject");
        }

        LocalDate lessonDate = occurrence.getLessonDate();

        boolean onLeave = staffLeaveRequestRepository
                .existsByStaffMember_IdAndInstitution_IdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        substitute.getStaffMember().getId(),
                        institutionId,
                        LeaveRequestStatus.APPROVED,
                        lessonDate,
                        lessonDate);

        if (onLeave) {
            throw new BusinessRuleViolationException(
                    "The substitute has approved leave on the lesson date");
        }

        var slot = lesson.getSlot();

        boolean hasConflict = occurrenceRepository
                .existsConflictingOccurrence(
                        substitute.getId(),
                        lessonDate,
                        slot.getStartTime(),
                        slot.getEndTime(),
                        occurrence.getId(),
                        LessonOccurrenceStatus.CANCELLED);

        if (hasConflict) {
            throw new BusinessRuleViolationException(
                    "The substitute has another lesson overlapping this time");
        }

        UserAccount currentUser = userAccountRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user account not found"));

        StaffAssignment previousSubstitute =
                occurrence.getSubstituteStaffAssignment();

        occurrence.assignSubstitute(substitute, currentUser);

        auditRepository.save(new LessonSubstituteAudit(
                occurrence,
                previousSubstitute,
                substitute,
                currentUser,
                request.comment()));

        // The occurrence is managed in this transaction; JPA persists its update.
        return toResponse(occurrence);
    }

    @Transactional(readOnly = true)
    public List<LessonSubstituteAuditResponse> getAuditHistory(
            UUID occurrenceId,
            Authentication authentication) {

        LessonOccurrence occurrence = occurrenceRepository
                .findById(occurrenceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson occurrence not found"));

        UUID institutionId = occurrence.getScheduledLesson()
                .getSection()
                .getSchoolClass()
                .getAcademicYear()
                .getInstitution()
                .getId();

        if (!organizationScopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }

        return auditRepository
                .findByOccurrence_IdOrderByChangedAtDesc(occurrenceId)
                .stream()
                .map(audit -> new LessonSubstituteAuditResponse(
                        audit.getId(),
                        occurrenceId,
                        audit.getPreviousSubstitute() == null
                                ? null
                                : audit.getPreviousSubstitute().getId(),
                        audit.getNewSubstitute().getId(),
                        audit.getChangedBy().getId(),
                        audit.getComment(),
                        audit.getChangedAt()))
                .toList();
    }

    private SubstituteAssignmentResponse toResponse(
            LessonOccurrence occurrence) {

        var lesson = occurrence.getScheduledLesson();
        var slot = lesson.getSlot();

        return new SubstituteAssignmentResponse(
                occurrence.getId(),
                lesson.getId(),
                occurrence.getLessonDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                lesson.getTeacherAssignment().getId(),
                occurrence.getSubstituteStaffAssignment().getId(),
                occurrence.getAssignedBy().getId(),
                occurrence.getSubstituteAssignedAt(),
                occurrence.getStatus());
    }
}