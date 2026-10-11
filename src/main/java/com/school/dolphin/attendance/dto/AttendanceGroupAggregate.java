package com.school.dolphin.attendance.dto;

import java.util.UUID;

public record AttendanceGroupAggregate(
        UUID groupId,
        String groupName,
        Long attendedLessons,
        Long eligibleLessons,
        Long excusedLessons) {
}