package com.school.dolphin.student.service;

import com.school.dolphin.academic.entity.EnrollmentStatus;
import com.school.dolphin.academic.entity.StudentEnrollment;
import com.school.dolphin.academic.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Resolves the class sections a student is actively enrolled in on a given date.
 * Used to translate a student-scoped record (a report card, a student mark) into
 * the section scope a staff member must be authorized for, given that assessments
 * and marks are stored per student and not per section.
 */
@Component
@RequiredArgsConstructor
public class StudentSectionResolver {

    private final StudentEnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public Set<UUID> findActiveSectionIds(UUID studentId, LocalDate onDate) {
        Set<UUID> sectionIds = new HashSet<>();

        for (StudentEnrollment enrollment : enrollmentRepository
                .findByStudent_IdAndStatus(studentId, EnrollmentStatus.ACTIVE)) {
            if (coversDate(enrollment, onDate)) {
                sectionIds.add(enrollment.getSection().getId());
            }
        }

        return sectionIds;
    }

    @Transactional(readOnly = true)
    public Map<UUID, Set<UUID>> findActiveSectionIds(
            Collection<UUID> studentIds,
            LocalDate onDate
    ) {
        if (studentIds == null || studentIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, Set<UUID>> sectionIdsByStudent = new HashMap<>();

        for (StudentEnrollment enrollment : enrollmentRepository
                .findByStudent_IdInAndStatus(studentIds, EnrollmentStatus.ACTIVE)) {
            if (coversDate(enrollment, onDate)) {
                sectionIdsByStudent
                        .computeIfAbsent(
                                enrollment.getStudent().getId(),
                                ignored -> new HashSet<>())
                        .add(enrollment.getSection().getId());
            }
        }

        return sectionIdsByStudent;
    }

    private boolean coversDate(StudentEnrollment enrollment, LocalDate onDate) {
        return !enrollment.getStartDate().isAfter(onDate)
                && (enrollment.getEndDate() == null
                || !enrollment.getEndDate().isBefore(onDate));
    }
}
