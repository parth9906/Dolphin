
package com.school.dolphin.parent.service;

import com.school.dolphin.attendance.repository.AttendanceRepository;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.guardian.entity.StudentGuardian;
import com.school.dolphin.guardian.repository.StudentGuardianRepository;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.parent.dto.ParentAttendanceResponse;
import com.school.dolphin.parent.dto.ParentPortalStudentResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.school.dolphin.attendance.entity.AttendanceRecord;
import com.school.dolphin.common.exception.BusinessRuleViolationException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class ParentPortalService {

    private final StudentGuardianRepository studentGuardianRepository;

    private final AttendanceRepository attendanceRepository;

    public ParentPortalService(
            StudentGuardianRepository studentGuardianRepository,
            AttendanceRepository attendanceRepository
    ) {
        this.studentGuardianRepository = studentGuardianRepository;
        this.attendanceRepository = attendanceRepository;
    }

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