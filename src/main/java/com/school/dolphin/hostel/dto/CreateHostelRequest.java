package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.HostelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateHostelRequest(
        @NotNull UUID institutionId,
        UUID campusId,
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 200) String name,
        @NotNull HostelType hostelType,
        @Size(max = 200) String wardenName,
        @Size(max = 2000) String address
) {}
