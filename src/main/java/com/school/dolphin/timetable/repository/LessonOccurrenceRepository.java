package com.school.dolphin.timetable.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.school.dolphin.timetable.entity.LessonOccurrence;
import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;

public interface LessonOccurrenceRepository
        extends JpaRepository<LessonOccurrence, UUID> {

    boolean existsByScheduledLesson_IdAndLessonDate(
            UUID scheduledLessonId,
            LocalDate lessonDate);

    List<LessonOccurrence>
    findByScheduledLesson_Section_IdAndLessonDateBetweenOrderByLessonDateAsc(
            UUID sectionId,
            LocalDate startDate,
            LocalDate endDate);

    @Modifying
    @Query("""
        update LessonOccurrence occurrence
           set occurrence.status = :newStatus
         where occurrence.scheduledLesson.teacherAssignment.id = :teacherAssignmentId
           and occurrence.lessonDate between :startDate and :endDate
           and occurrence.status = :currentStatus
        """)
    int updateStatusForTeacherDateRange(
            @Param("teacherAssignmentId") UUID teacherAssignmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("currentStatus") LessonOccurrenceStatus currentStatus,
            @Param("newStatus") LessonOccurrenceStatus newStatus);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select o
      from LessonOccurrence o
      join fetch o.scheduledLesson lesson
      join fetch lesson.section section
      join fetch section.schoolClass schoolClass
      join fetch schoolClass.academicYear academicYear
      join fetch academicYear.institution
     where o.id = :occurrenceId
    """)
    Optional<LessonOccurrence> findByIdForUpdate(
            @Param("occurrenceId") UUID occurrenceId);

    @Query("""
    select count(o) > 0
      from LessonOccurrence o
      join o.scheduledLesson lesson
      join lesson.slot slot
     where o.lessonDate = :lessonDate
       and o.id <> :excludedOccurrenceId
       and o.status <> :cancelledStatus
       and (
            lesson.teacherAssignment.id = :staffAssignmentId
            or o.substituteStaffAssignment.id = :staffAssignmentId
       )
       and slot.startTime < :endTime
       and slot.endTime > :startTime
    """)
    boolean existsConflictingOccurrence(
            @Param("staffAssignmentId") UUID staffAssignmentId,
            @Param("lessonDate") LocalDate lessonDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludedOccurrenceId") UUID excludedOccurrenceId,
            @Param("cancelledStatus") LessonOccurrenceStatus cancelledStatus);

    @Query("""
    select o
      from LessonOccurrence o
      join fetch o.scheduledLesson lesson
      join fetch lesson.section section
      join fetch section.schoolClass schoolClass
      join fetch schoolClass.academicYear academicYear
      join fetch academicYear.institution institution
      join fetch lesson.slot slot
      join fetch lesson.teacherAssignment teacher
      join fetch lesson.subject subject
     where institution.id = :institutionId
       and o.lessonDate between :startDate and :endDate
       and o.status in :statuses
     order by o.lessonDate asc, slot.startTime asc
    """)
    List<LessonOccurrence> findCoverageOccurrences(
            @Param("institutionId") UUID institutionId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<LessonOccurrenceStatus> statuses);
}
