
package com.school.dolphin.assessment.controller;

import com.school.dolphin.assessment.dto.*;
import com.school.dolphin.assessment.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ASSESSMENT_CREATE')")
    public AssessmentResponse createAssessment(
            @Valid @RequestBody CreateAssessmentRequest request,
            Authentication authentication) {

        return assessmentService.createAssessment(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MARKS_READ')")
    public Page<AssessmentResponse> searchAssessments(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID sectionId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,
            @PageableDefault(
                    size = 20,
                    sort = "assessmentDate",
                    direction = Sort.Direction.DESC
            ) Pageable pageable,
            Authentication authentication) {

        return assessmentService.searchAssessments(
                institutionId,
                sectionId,
                fromDate,
                toDate,
                pageable,
                authentication);
    }

    @PostMapping("/{assessmentId}/marks")
    @PreAuthorize("hasAuthority('MARKS_RECORD')")
    public List<StudentMarkResponse> recordMarks(
            @PathVariable UUID assessmentId,
            @Valid @RequestBody RecordMarksRequest request,
            Authentication authentication) {

        return assessmentService.recordMarks(
                assessmentId, request, authentication);
    }

    @GetMapping("/{assessmentId}/results")
    @PreAuthorize("hasAuthority('MARKS_READ')")
    public List<StudentMarkResponse> getAssessmentResults(
            @PathVariable UUID assessmentId,
            Authentication authentication) {

        return assessmentService.getAssessmentResults(
                assessmentId, authentication);
    }


    @PutMapping("/marks/{markId}")
    @PreAuthorize("hasAuthority('MARKS_UPDATE')")
    public StudentMarkResponse updateStudentMark(
            @PathVariable UUID markId,
            @Valid @RequestBody UpdateStudentMarkRequest request,
            Authentication authentication) {

        return assessmentService.updateStudentMark(
                markId, request, authentication);
    }

    @GetMapping("/marks/{markId}/audit")
    @PreAuthorize("hasAuthority('MARKS_AUDIT_READ')")
    public List<StudentMarkAuditResponse> getStudentMarkAudit(
            @PathVariable UUID markId,
            Authentication authentication) {

        return assessmentService.getStudentMarkAudit(
                markId, authentication);
    }


    @PutMapping("/{assessmentId}")
    @PreAuthorize("hasAuthority('ASSESSMENT_UPDATE')")
    public AssessmentResponse updateAssessment(
            @PathVariable UUID assessmentId,
            @Valid @RequestBody UpdateAssessmentRequest request,
            Authentication authentication) {

        return assessmentService.updateAssessment(
                assessmentId, request, authentication);
    }


    @GetMapping("/{assessmentId}/roster")
    @PreAuthorize("hasAuthority('MARKS_READ')")
    public Page<AssessmentRosterItem> getAssessmentRoster(
            @PathVariable UUID assessmentId,
            @PageableDefault(size = 100) Pageable pageable,
            Authentication authentication) {

        return assessmentService.getAssessmentRoster(
                assessmentId, pageable, authentication);
    }

}
