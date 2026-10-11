package com.school.dolphin.timetable.repository;


import com.school.dolphin.timetable.entity.ScheduledLesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScheduledLessonRepository
        extends JpaRepository<ScheduledLesson, UUID> {

    List<ScheduledLesson>
    findBySection_IdAndActiveTrue(UUID sectionId);

    List<ScheduledLesson>
    findByTeacherAssignment_IdAndActiveTrue(UUID staffAssignmentId);

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
}