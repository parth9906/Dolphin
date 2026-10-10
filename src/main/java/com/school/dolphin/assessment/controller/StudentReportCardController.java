package com.school.dolphin.assessment.controller;

import com.school.dolphin.assessment.dto.StudentReportCardResponse;
import com.school.dolphin.assessment.service.StudentReportCardService;

import jakarta.validation.constraints.NotNull;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
public class StudentReportCardController {

    private final StudentReportCardService reportCardService;

    public StudentReportCardController(
            StudentReportCardService reportCardService
    ) {
        this.reportCardService = reportCardService;
    }

    @GetMapping("/{studentId}/report-card")
    @PreAuthorize("hasAuthority('MARKS_READ')")
    public StudentReportCardResponse getReportCard(
            @PathVariable UUID studentId,
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
        return reportCardService.getReportCard(
                studentId,
                fromDate,
                toDate,
                authentication
        );
    }
}