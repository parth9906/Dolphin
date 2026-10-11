package com.school.dolphin.discipline.controller;

import com.school.dolphin.discipline.dto.CreateDisciplineIncidentRequest;
import com.school.dolphin.discipline.dto.DisciplineIncidentResponse;
import com.school.dolphin.discipline.dto.UpdateDisciplineIncidentStatusRequest;
import com.school.dolphin.discipline.entity.DisciplineIncidentStatus;
import com.school.dolphin.discipline.entity.DisciplineSeverity;
import com.school.dolphin.discipline.service.DisciplineIncidentService;
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
@RequestMapping("/api/v1/discipline/incidents")
@RequiredArgsConstructor
public class DisciplineIncidentController {

    private final DisciplineIncidentService disciplineIncidentService;

    @PostMapping
    @PreAuthorize("hasAuthority('DISCIPLINE_INCIDENT_CREATE')")
    public DisciplineIncidentResponse create(
            @Valid @RequestBody CreateDisciplineIncidentRequest request,
            Authentication authentication
    ) {
        return disciplineIncidentService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DISCIPLINE_INCIDENT_READ')")
    public Page<DisciplineIncidentResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false) DisciplineIncidentStatus status,
            @RequestParam(required = false) DisciplineSeverity severity,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "incidentDate") Pageable pageable,
            Authentication authentication
    ) {
        return disciplineIncidentService.search(
                institutionId,
                studentId,
                campusId,
                status,
                severity,
                fromDate,
                toDate,
                pageable,
                authentication);
    }

    @GetMapping("/{incidentId}")
    @PreAuthorize("hasAuthority('DISCIPLINE_INCIDENT_READ')")
    public DisciplineIncidentResponse getById(
            @PathVariable UUID incidentId,
            Authentication authentication
    ) {
        return disciplineIncidentService.getById(incidentId, authentication);
    }

    @PatchMapping("/{incidentId}/status")
    @PreAuthorize("hasAuthority('DISCIPLINE_INCIDENT_UPDATE')")
    public DisciplineIncidentResponse updateStatus(
            @PathVariable UUID incidentId,
            @Valid @RequestBody UpdateDisciplineIncidentStatusRequest request,
            Authentication authentication
    ) {
        return disciplineIncidentService.updateStatus(
                incidentId, request, authentication);
    }
}
