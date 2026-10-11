package com.school.dolphin.hostel.dto;

import com.school.dolphin.hostel.entity.HostelAllocation;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import com.school.dolphin.student.entity.Student;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HostelAllocationResponse(
        UUID id,
        UUID hostelId,
        UUID roomId,
        String roomNumber,
        UUID studentId,
        String admissionNumber,
        String studentName,
        LocalDate startDate,
        LocalDate endDate,
        HostelAllocationStatus status,
        String notes,
        UUID allocatedByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        Long version
) {
    public static HostelAllocationResponse from(HostelAllocation allocation) {
        Student student = allocation.getStudent();

        return new HostelAllocationResponse(
                allocation.getId(),
                allocation.getRoom().getHostel().getId(),
                allocation.getRoom().getId(),
                allocation.getRoom().getRoomNumber(),
                student.getId(),
                student.getAdmissionNumber(),
                fullName(student),
                allocation.getStartDate(),
                allocation.getEndDate(),
                allocation.getStatus(),
                allocation.getNotes(),
                allocation.getAllocatedBy().getId(),
                allocation.getCreatedAt(),
                allocation.getUpdatedAt(),
                allocation.getVersion()
        );
    }

    private static String fullName(Student student) {
        String lastName = student.getLastName();

        return lastName == null || lastName.isBlank()
                ? student.getFirstName()
                : student.getFirstName() + " " + lastName;
    }
}
