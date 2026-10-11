package com.school.dolphin.student.dto;

import com.school.dolphin.student.entity.Student;

import java.time.LocalDate;
import java.util.UUID;

public record StudentResponse(
        UUID id,
        UUID institutionId,
        UUID campusId,
        String admissionNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        boolean active
) {
    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getInstitution().getId(),
                student.getCampus() == null
                        ? null
                        : student.getCampus().getId(),
                student.getAdmissionNumber(),
                student.getFirstName(),
                student.getLastName(),
                student.getDateOfBirth(),
                student.isActive()
        );
    }
}
