
package com.school.dolphin.parent.service;

import com.school.dolphin.attendance.dto.AttendanceAlertResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceItemResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceSummaryResponse;
import com.school.dolphin.attendance.entity.LessonAttendanceRecord;
import com.school.dolphin.attendance.entity.LessonAttendanceStatus;
import com.school.dolphin.attendance.repository.AttendanceAlertRepository;
import com.school.dolphin.attendance.repository.AttendanceRepository;
import com.school.dolphin.attendance.repository.LessonAttendanceRepository;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.guardian.entity.StudentGuardian;
import com.school.dolphin.guardian.repository.StudentGuardianRepository;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.parent.dto.ParentAttendanceResponse;
import com.school.dolphin.parent.dto.ParentPortalStudentResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.school.dolphin.attendance.entity.AttendanceRecord;
import com.school.dolphin.common.exception.BusinessRuleViolationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ParentPortalService {

    private final StudentGuardianRepository studentGuardianRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserAccountRepository userAccountRepository;
    private final LessonAttendanceRepository lessonAttendanceRepository;
    private final AttendanceAlertRepository attendanceAlertRepository;



    @Transactional(readOnly = true)
    public List<ParentPortalStudentResponse> getLinkedStudents(
            Authentication authentication
    ) {
        UUID userId = authenticatedUserId(authentication);

        return studentGuardianRepository
                .findActiveStudentsForGuardianAccount(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParentPortalStudentResponse getLinkedStudent(
            UUID studentId,
            Authentication authentication
    ) {
        UUID userId = authenticatedUserId(authentication);

        StudentGuardian relationship = studentGuardianRepository
                .findActiveStudentForGuardianAccount(userId, studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student not found"
                        ));

        return toResponse(relationship);
    }

    @Transactional(readOnly = true)
    public List<ParentAttendanceResponse> getStudentAttendance(
            UUID studentId,
            LocalDate from,
            LocalDate to,
            Authentication authentication) {

        if (from == null || to == null || to.isBefore(from)) {
            throw new BusinessRuleViolationException(
                    "The attendance date range is invalid."
            );
        }

        if (ChronoUnit.DAYS.between(from, to) > 90) {
            throw new BusinessRuleViolationException(
                    "Attendance can be viewed for a maximum 90-day range."
            );
        }

        UUID userId = authenticatedUserId(authentication);

        // Verify the active guardian-to-student relationship first.
        boolean linked = studentGuardianRepository
                .findActiveStudentForGuardianAccount(userId, studentId)
                .isPresent();

        if (!linked) {
            // Avoid revealing whether an unrelated student exists.
            throw new ResourceNotFoundException("Student not found");
        }

        return attendanceRepository
                .findByStudent_IdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
                        studentId, from, to
                )
                .stream()
                .map(this::toParentAttendanceResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public ParentLessonAttendanceSummaryResponse getLessonAttendanceSummary(
            UUID studentId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        validateParentAttendanceRange(startDate, endDate);

        UUID userId = userAccountRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user account not found"))
                .getId();

        // Reuse the existing active guardian-student authorization query.
        studentGuardianRepository
                .findActiveStudentForGuardianAccount(userId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found or not linked to this parent"));

        List<LessonAttendanceRecord> records =
                lessonAttendanceRepository.findParentLessonAttendance(
                        studentId, startDate, endDate);

        long attended = records.stream()
                .filter(record ->
                        record.getStatus() == LessonAttendanceStatus.PRESENT
                                || record.getStatus() == LessonAttendanceStatus.LATE)
                .count();

        long missed = records.stream()
                .filter(record ->
                        record.getStatus() == LessonAttendanceStatus.ABSENT)
                .count();

        long excused = records.stream()
                .filter(record ->
                        record.getStatus() == LessonAttendanceStatus.EXCUSED)
                .count();

        long eligible = attended + missed;

        BigDecimal percentage = eligible == 0
                ? BigDecimal.ZERO.setScale(2)
                : BigDecimal.valueOf(attended)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(eligible), 2, RoundingMode.HALF_UP);

        return new ParentLessonAttendanceSummaryResponse(
                studentId,
                startDate,
                endDate,
                attended,
                missed,
                excused,
                eligible,
                percentage);
    }


    @Transactional(readOnly = true)
    public List<ParentLessonAttendanceItemResponse> getLessonAttendanceHistory(
            UUID studentId,
            LocalDate startDate,
            LocalDate endDate,
            Authentication authentication) {

        validateParentAttendanceRange(startDate, endDate);

        UUID userId = userAccountRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user account not found"))
                .getId();

        studentGuardianRepository
                .findActiveStudentForGuardianAccount(userId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found or not linked to this parent"));

        return lessonAttendanceRepository.findParentLessonAttendance(
                        studentId, startDate, endDate)
                .stream()
                .map(this::toParentAttendanceItem)
                .toList();
    }


    private ParentLessonAttendanceItemResponse toParentAttendanceItem(
            LessonAttendanceRecord record) {

        var occurrence = record.getLessonOccurrence();
        var lesson = occurrence.getScheduledLesson();
        var slot = lesson.getSlot();

        return new ParentLessonAttendanceItemResponse(
                record.getId(),
                occurrence.getId(),
                occurrence.getLessonDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                lesson.getSubject().getName(),
                record.getStatus(),
                record.getRemarks());
    }

    @Transactional(readOnly = true)
    public List<AttendanceAlertResponse> getAttendanceAlerts(
            UUID studentId,
            Authentication authentication) {

        UUID userId = userAccountRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user account not found"))
                .getId();

        studentGuardianRepository
                .findActiveStudentForGuardianAccount(userId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found or not linked to this parent"));

        return attendanceAlertRepository
                .findByStudent_IdOrderByGeneratedAtDesc(studentId)
                .stream()
                .map(alert -> new AttendanceAlertResponse(
                        alert.getId(),
                        alert.getStudent().getId(),
                        alert.getPeriodStart(),
                        alert.getPeriodEnd(),
                        alert.getThresholdPercent(),
                        alert.getAttendancePercent(),
                        alert.getStatus(),
                        alert.getGeneratedAt(),
                        alert.getAcknowledgedAt()))
                .toList();
    }


    private void validateParentAttendanceRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null
                || endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "A valid attendance date range is required");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (days > 90) {
            throw new BusinessRuleViolationException(
                    "Parent attendance history supports a maximum range of 90 days");
        }
    }

    private ParentAttendanceResponse toParentAttendanceResponse(
            AttendanceRecord record) {

        return new ParentAttendanceResponse(
                record.getStudent().getId(),
                record.getAttendanceDate(),
                record.getStatus(),
                record.getRemarks()
        );
    }

    private UUID authenticatedUserId(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal()
                instanceof AuthenticatedUser user)) {
            throw new AccessDeniedException(
                    "Authenticated guardian account required"
            );
        }

        return user.userId();
    }

    private ParentPortalStudentResponse toResponse(
            StudentGuardian relationship
    ) {
        var student = relationship.getStudent();

        return new ParentPortalStudentResponse(
                student.getId(),
                student.getAdmissionNumber(),
                student.getFirstName(),
                student.getLastName(),
                student.getDateOfBirth()
        );
    }

}