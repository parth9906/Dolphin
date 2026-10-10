
package com.school.dolphin.academic.controller;

import com.school.dolphin.academic.dto.*;
import com.school.dolphin.academic.service.AcademicStructureService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic")
public class AcademicStructureController {

    private final AcademicStructureService service;

    public AcademicStructureController(AcademicStructureService service) {
        this.service = service;
    }

    @PostMapping("/years")
    @PreAuthorize("hasAuthority('ACADEMIC_YEAR_CREATE')")
    public UUID createAcademicYear(
            @Valid @RequestBody CreateAcademicYearRequest request,
            Authentication authentication
    ) {
        return service.createAcademicYear(request, authentication);
    }

    @PostMapping("/classes")
    @PreAuthorize("hasAuthority('CLASS_CREATE')")
    public UUID createClass(
            @Valid @RequestBody CreateSchoolClassRequest request,
            Authentication authentication
    ) {
        return service.createClass(request, authentication);
    }

    @PostMapping("/sections")
    @PreAuthorize("hasAuthority('SECTION_CREATE')")
    public UUID createSection(
            @Valid @RequestBody CreateClassSectionRequest request,
            Authentication authentication
    ) {
        return service.createSection(request, authentication);
    }

    @PostMapping("/enrollments")
    @PreAuthorize("hasAuthority('STUDENT_ENROLL')")
    public UUID enrollStudent(
            @Valid @RequestBody EnrollStudentRequest request,
            Authentication authentication
    ) {
        return service.enrollStudent(request, authentication);
    }

    @PatchMapping("/years/{academicYearId}/activate")
    @PreAuthorize("hasAuthority('ACADEMIC_YEAR_ACTIVATE')")
    public UUID activateAcademicYear(
            @PathVariable UUID academicYearId,
            Authentication authentication
    ) {
        return service.activateAcademicYear(academicYearId, authentication);
    }


    @GetMapping("/years")
    @PreAuthorize("hasAuthority('ACADEMIC_YEAR_READ')")
    public List<AcademicYearResponse> getAcademicYears(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return service.getAcademicYears(institutionId, authentication);
    }

    @GetMapping("/years/{academicYearId}/classes")
    @PreAuthorize("hasAuthority('CLASS_READ')")
    public List<SchoolClassResponse> getClasses(
            @PathVariable UUID academicYearId,
            Authentication authentication
    ) {
        return service.getClasses(academicYearId, authentication);
    }

    @GetMapping("/classes/{schoolClassId}/sections")
    @PreAuthorize("hasAuthority('SECTION_READ')")
    public List<ClassSectionResponse> getSections(
            @PathVariable UUID schoolClassId,
            Authentication authentication
    ) {
        return service.getSections(schoolClassId, authentication);
    }

    @GetMapping("/sections/{sectionId}/students")
    @PreAuthorize("hasAuthority('ENROLLMENT_READ')")
    public Page<StudentEnrollmentResponse> getSectionRoster(
            @PathVariable UUID sectionId,
            @PageableDefault(size = 20, sort = "startDate") Pageable pageable,
            Authentication authentication
    ) {
        return service.getSectionRoster(sectionId, pageable, authentication);
    }

    @GetMapping("/students/{studentId}/enrollments")
    @PreAuthorize("hasAuthority('ENROLLMENT_READ')")
    public List<StudentEnrollmentResponse> getEnrollmentHistory(
            @PathVariable UUID studentId,
            Authentication authentication
    ) {
        return service.getStudentEnrollmentHistory(studentId, authentication);
    }

    @PatchMapping("/enrollments/{enrollmentId}/complete")
    @PreAuthorize("hasAuthority('ENROLLMENT_COMPLETE')")
    public UUID completeEnrollment(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody EnrollmentEndRequest request,
            Authentication authentication
    ) {
        return service.completeEnrollment(enrollmentId, request, authentication);
    }

    @PatchMapping("/enrollments/{enrollmentId}/withdraw")
    @PreAuthorize("hasAuthority('ENROLLMENT_WITHDRAW')")
    public UUID withdrawStudent(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody EnrollmentEndRequest request,
            Authentication authentication
    ) {
        return service.withdrawStudent(enrollmentId, request, authentication);
    }

    @PostMapping("/enrollments/{enrollmentId}/transfer")
    @PreAuthorize("hasAuthority('STUDENT_TRANSFER')")
    public UUID transferStudent(
            @PathVariable UUID enrollmentId,
            @Valid @RequestBody TransferStudentRequest request,
            Authentication authentication
    ) {
        return service.transferStudent(enrollmentId, request, authentication);
    }

    @PatchMapping("/years/{academicYearId}/close")
    @PreAuthorize("hasAuthority('ACADEMIC_YEAR_CLOSE')")
    public UUID closeAcademicYear(
            @PathVariable UUID academicYearId,
            Authentication authentication
    ) {
        return service.closeAcademicYear(academicYearId, authentication);
    }
}