package com.school.dolphin.timetable.dto;


import java.time.LocalTime;
import java.util.UUID;

public record ScheduledLessonResponse(
        UUID id,
        UUID sectionId,
        String sectionName,
        UUID slotId,
        int dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        UUID teacherAssignmentId,
        String teacherName,
        UUID subjectId,
        String subjectName,
        UUID roomId,
        String roomName
) {}
