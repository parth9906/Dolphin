package com.school.dolphin.attendance.service;

import com.school.dolphin.attendance.dto.AttendanceResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceItemResponse;
import com.school.dolphin.attendance.dto.ParentLessonAttendanceSummaryResponse;
import com.school.dolphin.attendance.entity.LessonAttendanceRecord;
import com.school.dolphin.attendance.entity.LessonAttendanceStatus;
import com.school.dolphin.attendance.repository.AttendanceRepository;
import com.school.dolphin.attendance.repository.LessonAttendanceRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.service.CurrentStudentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Read-only student portal views over the authenticated student's own attendance.
 * The subject student is always derived from the authenticated account
 * ({@link CurrentStudentResolver}); the client never supplies a student id, so a
 * student cannot read another student's records.
 */
@Service
@RequiredArgsConstructor
public class StudentPortalAttendanceService {

    private static final long MAX_RANGE_DAYS = 90;

    private final CurrentStudentResolver currentStudentResolver;
    private final AttendanceRepository attendanceRepository;
    private final LessonAttendanceRepository lessonAttendanceRepository;

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance(
            LocalDate from,
            LocalDate to,
            Authentication authentication
    ) {
        Student student = requireActiveStudent(authentication);
        validateRange(from, to);

        return attendanceRepository
                .findByStudent_IdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
                        student.getId(), from, to)
                .stream()
                .map(record -> new AttendanceResponse(
                        record.getId(),
                        student.getId(),
                        student.getInstitution().getId(),
                        record.getAttendanceDate(),
                        record.getStatus(),
                        record.getRemarks()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParentLessonAttendanceItemResponse> getMyLessonAttendance(
            LocalDate from,
            LocalDate to,
            Authentication authentication
    ) {
        Student student = requireActiveStudent(authentication);
        validateRange(from, to);

        return lessonAttendanceRepository
                .findParentLessonAttendance(student.getId(), from, to)
                .stream()
                .map(this::toLessonAttendanceItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParentLessonAttendanceSummaryResponse getMyLessonAttendanceSummary(
            LocalDate from,
            LocalDate to,
            Authentication authentication
    ) {
        Student student = requireActiveStudent(authentication);
        validateRange(from, to);

        List<LessonAttendanceRecord> records =
                lessonAttendanceRepository.findParentLessonAttendance(
                        student.getId(), from, to);

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
                student.getId(),
                from,
                to,
                attended,
                missed,
                excused,
                eligible,
                percentage);
    }

    private ParentLessonAttendanceItemResponse toLessonAttendanceItem(
            LessonAttendanceRecord record
    ) {
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

    private Student requireActiveStudent(Authentication authentication) {
        Student student = currentStudentResolver.requireStudent(authentication);

        if (!student.isActive()) {
            throw new AccessDeniedException(
                    "Inactive students cannot access the student portal");
        }

        return student;
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new BusinessRuleViolationException(
                    "A valid attendance date range is required");
        }

        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            throw new BusinessRuleViolationException(
                    "Attendance can be viewed for a maximum 90-day range");
        }
    }
}
