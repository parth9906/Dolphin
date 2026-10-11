package com.school.dolphin.admissions.controller;

import com.school.dolphin.admissions.dto.AdmissionApplicationResponse;
import com.school.dolphin.admissions.dto.CreateAdmissionApplicationRequest;
import com.school.dolphin.admissions.entity.AdmissionApplicationStatus;
import com.school.dolphin.admissions.service.AdmissionApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admissions/applications")
@RequiredArgsConstructor
public class AdmissionApplicationController {

    private final AdmissionApplicationService admissionApplicationService;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMISSION_APPLICATION_CREATE')")
    public AdmissionApplicationResponse create(
            @Valid @RequestBody CreateAdmissionApplicationRequest request,
            Authentication authentication
    ) {
        return admissionApplicationService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMISSION_APPLICATION_READ')")
    public Page<AdmissionApplicationResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) AdmissionApplicationStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "applicationDate")
                    Pageable pageable,
            Authentication authentication
    ) {
        return admissionApplicationService.search(
                institutionId,
                campusId,
                status,
                fromDate,
                toDate,
                pageable,
                authentication);
    }

    @GetMapping("/{applicationId}")
    @PreAuthorize("hasAuthority('ADMISSION_APPLICATION_READ')")
    public AdmissionApplicationResponse getById(
            @PathVariable UUID applicationId,
            Authentication authentication
    ) {
        return admissionApplicationService.getById(
                applicationId, authentication);
    }
}
