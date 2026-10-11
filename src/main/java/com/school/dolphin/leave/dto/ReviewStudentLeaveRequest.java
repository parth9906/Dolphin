package com.school.dolphin.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewStudentLeaveRequest(
        @NotBlank @Size(max = 1000) String comment
) {}
