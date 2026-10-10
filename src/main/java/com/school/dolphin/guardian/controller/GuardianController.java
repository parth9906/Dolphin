
package com.school.dolphin.guardian.controller;

import com.school.dolphin.guardian.dto.*;
import com.school.dolphin.guardian.service.GuardianService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @PostMapping("/guardians")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('GUARDIAN_CREATE')")
    public GuardianResponse createGuardian(
            @Valid @RequestBody CreateGuardianRequest request,
            Authentication authentication
    ) {
        return guardianService.createGuardian(request, authentication);
    }

    @GetMapping("/guardians/{guardianId}")
    @PreAuthorize("hasAuthority('GUARDIAN_READ')")
    public GuardianResponse getGuardian(
            @PathVariable UUID guardianId,
            Authentication authentication
    ) {
        return guardianService.getGuardian(guardianId, authentication);
    }

    @PostMapping("/students/{studentId}/guardians/{guardianId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('STUDENT_GUARDIAN_LINK')")
    public StudentGuardianResponse linkGuardian(
            @PathVariable UUID studentId,
            @PathVariable UUID guardianId,
            @Valid @RequestBody LinkGuardianRequest request,
            Authentication authentication
    ) {
        return guardianService.linkGuardian(
                studentId, guardianId, request, authentication
        );
    }

    @GetMapping("/students/{studentId}/guardians")
    @PreAuthorize("hasAuthority('GUARDIAN_READ')")
    public List<StudentGuardianResponse> getStudentGuardians(
            @PathVariable UUID studentId,
            Authentication authentication
    ) {
        return guardianService.getStudentGuardians(studentId, authentication);
    }


    @PutMapping("/guardians/{guardianId}")
    @PreAuthorize("hasAuthority('GUARDIAN_UPDATE')")
    public GuardianResponse updateGuardian(
            @PathVariable UUID guardianId,
            @Valid @RequestBody UpdateGuardianRequest request,
            Authentication authentication
    ) {
        return guardianService.updateGuardian(
                guardianId, request, authentication
        );
    }

    @PatchMapping("/guardians/{guardianId}/deactivate")
    @PreAuthorize("hasAuthority('GUARDIAN_DEACTIVATE')")
    public GuardianResponse deactivateGuardian(
            @PathVariable UUID guardianId,
            Authentication authentication
    ) {
        return guardianService.deactivateGuardian(guardianId, authentication);
    }

    @DeleteMapping("/students/{studentId}/guardians/{guardianId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('STUDENT_GUARDIAN_UNLINK')")
    public void unlinkGuardian(
            @PathVariable UUID studentId,
            @PathVariable UUID guardianId,
            Authentication authentication
    ) {
        guardianService.unlinkGuardian(studentId, guardianId, authentication);
    }
}