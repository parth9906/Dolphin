package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.HostelRoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateHostelRoomRequest(
        @NotBlank @Size(max = 20) String roomNumber,
        Integer floor,
        @NotNull HostelRoomType roomType,
        @NotNull @Min(1) Integer capacity
) {}
