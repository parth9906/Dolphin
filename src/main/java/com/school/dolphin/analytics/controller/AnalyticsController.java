package com.school.dolphin.analytics.controller;

import com.school.dolphin.analytics.dto.AnalyticsInstitutionSummaryResponse;
import com.school.dolphin.analytics.service.AnalyticsService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/institution-summary")
    @PreAuthorize("hasAuthority('ANALYTICS_READ')")
    public AnalyticsInstitutionSummaryResponse getInstitutionSummary(
            @RequestParam @NotNull UUID institutionId,
            @RequestParam @NotNull
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @NotNull
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication
    ) {
        return analyticsService.getInstitutionSummary(
                institutionId, fromDate, toDate, authentication);
    }
}
