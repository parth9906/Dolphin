package com.school.dolphin.attendance.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record MarkLessonAttendanceRequest(
        @NotEmpty
        @Size(max = 200)
        List<@Valid LessonAttendanceItemRequest> records) {
}