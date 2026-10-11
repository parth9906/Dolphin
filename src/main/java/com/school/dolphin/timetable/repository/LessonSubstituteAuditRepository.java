package com.school.dolphin.timetable.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.school.dolphin.timetable.entity.LessonSubstituteAudit;

public interface LessonSubstituteAuditRepository
        extends JpaRepository<LessonSubstituteAudit, UUID> {

    List<LessonSubstituteAudit>
    findByOccurrence_IdOrderByChangedAtDesc(UUID occurrenceId);
}