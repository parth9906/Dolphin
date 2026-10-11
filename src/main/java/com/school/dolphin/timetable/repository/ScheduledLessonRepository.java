package com.school.dolphin.timetable.repository;


import com.school.dolphin.timetable.entity.ScheduledLesson;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScheduledLessonRepository
        extends JpaRepository<ScheduledLesson, UUID> {

    List<ScheduledLesson>
    findBySection_IdAndActiveTrue(UUID sectionId);

    List<ScheduledLesson>
    findByTeacherAssignment_IdAndActiveTrue(UUID staffAssignmentId);

    @Query("""
        SELECT (COUNT(sl) > 0)
        FROM ScheduledLesson sl
        WHERE sl.active = true
          AND sl.section.id = :sectionId
          AND sl.teacherAssignment.staffMember.id = :staffMemberId
          AND sl.teacherAssignment.institution.id = :institutionId
          AND sl.teacherAssignment.status = :status
          AND sl.teacherAssignment.staffType = :staffType
          AND sl.teacherAssignment.startDate <= :onDate
          AND (sl.teacherAssignment.endDate IS NULL
               OR sl.teacherAssignment.endDate >= :onDate)
        """)
    boolean existsActiveTeachingAssignmentForSection(
            @Param("sectionId") UUID sectionId,
            @Param("staffMemberId") UUID staffMemberId,
            @Param("institutionId") UUID institutionId,
            @Param("status") StaffAssignmentStatus status,
            @Param("staffType") StaffType staffType,
            @Param("onDate") java.time.LocalDate onDate
    );

    boolean existsBySection_IdAndSlot_IdAndActiveTrue(
            UUID sectionId, UUID slotId);

    boolean existsByTeacherAssignment_IdAndSlot_IdAndActiveTrue(
            UUID staffAssignmentId, UUID slotId);

    boolean existsByRoom_IdAndSlot_IdAndActiveTrue(
            UUID roomId, UUID slotId);


    boolean existsBySection_IdAndSlot_IdAndIdNotAndActiveTrue(
            UUID sectionId, UUID slotId, UUID lessonId);

    boolean existsByTeacherAssignment_IdAndSlot_IdAndIdNotAndActiveTrue(
            UUID staffAssignmentId, UUID slotId, UUID lessonId);

    boolean existsByRoom_IdAndSlot_IdAndIdNotAndActiveTrue(
            UUID roomId, UUID slotId, UUID lessonId);

    @Query("""
        SELECT sl
        FROM ScheduledLesson sl
        JOIN FETCH sl.section
        JOIN FETCH sl.slot
        JOIN FETCH sl.subject
        JOIN FETCH sl.teacherAssignment assignment
        JOIN FETCH assignment.staffMember
        LEFT JOIN FETCH sl.room
        WHERE sl.active = true
          AND sl.section.id IN :sectionIds
        """)
    List<ScheduledLesson> findActiveTimetableForSections(
            @Param("sectionIds") java.util.Collection<UUID> sectionIds);
}
