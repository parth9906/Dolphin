
package com.school.dolphin.assessment.controller;

import com.school.dolphin.assessment.dto.*;
import com.school.dolphin.assessment.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
}