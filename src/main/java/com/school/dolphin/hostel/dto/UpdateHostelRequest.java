package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.HostelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateHostelRequest(
        @NotBlank @Size(max = 200) String name,
        @NotNull HostelType hostelType,
        @Size(max = 200) String wardenName,
        @Size(max = 2000) String address,
        @NotNull Long version
) {}
