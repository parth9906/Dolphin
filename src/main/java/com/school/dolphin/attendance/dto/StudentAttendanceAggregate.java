package com.school.dolphin.attendance.dto;

import java.util.UUID;

public record StudentAttendanceAggregate(
        UUID studentId,
        String studentName,
        Long attendedLessons,
        Long eligibleLessons,
        Long excusedLessons) {
}