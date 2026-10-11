package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.Hostel;
import com.school.dolphin.hostel.entity.HostelType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record HostelResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String code,
        String name,
        HostelType hostelType,
        String wardenName,
        String address,
        boolean active,
        UUID createdByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Long version
) {
    public static HostelResponse from(Hostel hostel) {
        return new HostelResponse(
                hostel.getId(),
                hostel.getInstitution().getId(),
                hostel.getCampus() == null ? null : hostel.getCampus().getId(),
                hostel.getCode(),
                hostel.getName(),
                hostel.getHostelType(),
                hostel.getWardenName(),
                hostel.getAddress(),
                hostel.isActive(),
                hostel.getCreatedBy().getId(),
                hostel.getCreatedAt(),
                hostel.getUpdatedAt(),
                hostel.getVersion()
        );
    }
}
