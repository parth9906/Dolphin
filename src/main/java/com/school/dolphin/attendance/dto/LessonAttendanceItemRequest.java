package com.school.dolphin.attendance.dto;

import java.util.UUID;

import com.school.dolphin.attendance.entity.LessonAttendanceStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LessonAttendanceItemRequest(
        @NotNull UUID studentId,
        @NotNull LessonAttendanceStatus status,
        @Size(max = 500) String remarks) {
}