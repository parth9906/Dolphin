package com.school.dolphin.assessment.controller;

import com.school.dolphin.assessment.dto.StudentReportCardResponse;
import com.school.dolphin.assessment.service.StudentReportCardService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Self-scoped student report card. The student is resolved from the
 * authenticated account, so the client cannot request another student's
 * report card (unlike {@code GET /api/v1/students/{studentId}/report-card},
 * which is institution-scoped staff access).
 */
@RestController
@RequestMapping("/api/v1/student-portal")
@RequiredArgsConstructor
public class StudentPortalReportCardController {

    private final StudentReportCardService reportCardService;

    @GetMapping("/report-card")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public StudentReportCardResponse getMyReportCard(
            @RequestParam
            @NotNull
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam
            @NotNull
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,
            Authentication authentication
    ) {
        return reportCardService.getMyReportCard(
                fromDate, toDate, authentication);
    }
}
