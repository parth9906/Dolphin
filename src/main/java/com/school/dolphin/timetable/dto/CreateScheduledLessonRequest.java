package com.school.dolphin.timetable.dto;


import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateScheduledLessonRequest(
        @NotNull UUID sectionId,
        @NotNull UUID slotId,
        @NotNull UUID teacherAssignmentId,
        @NotNull UUID subjectId,
        UUID roomId
) {}
