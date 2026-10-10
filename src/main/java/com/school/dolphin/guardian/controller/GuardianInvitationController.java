
package com.school.dolphin.guardian.controller;

import com.school.dolphin.guardian.dto.*;
import com.school.dolphin.guardian.service.GuardianInvitationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/guardian-invitations")
public class GuardianInvitationController {

    private final GuardianInvitationService invitationService;

    public GuardianInvitationController(
            GuardianInvitationService invitationService
    ) {
        this.invitationService = invitationService;
    }

    @PostMapping("/{guardianId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('GUARDIAN_INVITE')")
    public GuardianInvitationResponse createInvitation(
            @PathVariable UUID guardianId,
            @Valid @RequestBody CreateGuardianInvitationRequest request,
            Authentication authentication
    ) {
        return invitationService.createInvitation(
                guardianId, request, authentication
        );
    }

    @PostMapping("/accept")
    @ResponseStatus(HttpStatus.CREATED)
    public GuardianAccountAcceptedResponse acceptInvitation(
            @Valid @RequestBody AcceptGuardianInvitationRequest request
    ) {
        return invitationService.acceptInvitation(request);
    }
}