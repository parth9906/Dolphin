
package com.school.dolphin.guardian.service;

import com.school.dolphin.guardian.dto.*;
import com.school.dolphin.guardian.entity.Guardian;
import com.school.dolphin.guardian.entity.GuardianInvitation;
import com.school.dolphin.guardian.repository.GuardianInvitationRepository;
import com.school.dolphin.guardian.repository.GuardianRepository;
import com.school.dolphin.identity.entity.*;
import com.school.dolphin.identity.repository.*;
import com.school.dolphin.identity.security.AuthenticatedUser;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class GuardianInvitationService {

    private static final long INVITATION_VALIDITY_HOURS = 24;
    private static final String GUARDIAN_ROLE_CODE = "GUARDIAN";

    private final GuardianRepository guardianRepository;
    private final GuardianInvitationRepository invitationRepository;
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserOrganizationScopeRepository scopeRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final PasswordEncoder passwordEncoder;
    private final InvitationTokenService tokenService;
    private final ApplicationEventPublisher eventPublisher;

    public GuardianInvitationService(
            GuardianRepository guardianRepository,
            GuardianInvitationRepository invitationRepository,
            UserAccountRepository userAccountRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            UserOrganizationScopeRepository scopeRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            PasswordEncoder passwordEncoder,
            InvitationTokenService tokenService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.guardianRepository = guardianRepository;
        this.invitationRepository = invitationRepository;
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.scopeRepository = scopeRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public GuardianInvitationResponse createInvitation(
            UUID guardianId,
            CreateGuardianInvitationRequest request,
            Authentication authentication
    ) {
        Guardian guardian = guardianRepository
                .findByIdAndActiveTrue(guardianId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active guardian not found"));

        if (!scopeAuthorization.canAccessInstitution(
                authentication, guardian.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You cannot invite this guardian"
            );
        }

        String email = normalizeEmail(request.email());
        String guardianEmail = normalizeEmail(guardian.getEmail());

        if (guardianEmail == null || !guardianEmail.equals(email)) {
            throw new BusinessRuleViolationException(
                    "Invitation email must match the guardian's recorded email"
            );
        }

        if (guardian.getUserAccount() != null) {
            throw new BusinessRuleViolationException(
                    "Guardian already has a linked account"
            );
        }

        if (userAccountRepository.existsByEmail(email)) {
            throw new BusinessRuleViolationException(
                    "An account already exists for this email"
            );
        }

        UserAccount creator = authenticatedAccount(authentication);

        // Revoke older pending invitations before creating a new one.
        OffsetDateTime now = OffsetDateTime.now();
        invitationRepository
                .findByGuardian_IdAndAcceptedAtIsNullAndRevokedAtIsNull(
                        guardianId
                )
                .stream()
                .filter(invitation -> invitation.isPendingAt(now))
                .forEach(invitation -> invitation.setRevokedAt(now));

        String rawToken = tokenService.generateToken();
        OffsetDateTime expiresAt = now.plusHours(INVITATION_VALIDITY_HOURS);

        GuardianInvitation invitation = GuardianInvitation.builder()
                .guardian(guardian)
                .invitationEmail(email)
                .tokenHash(tokenService.hashToken(rawToken))
                .expiresAt(expiresAt)
                .createdBy(creator)
                .build();

        GuardianInvitation saved = invitationRepository.save(invitation);

        eventPublisher.publishEvent(new GuardianInvitationCreatedEvent(
                saved.getId(), email, rawToken, expiresAt
        ));

        return new GuardianInvitationResponse(
                saved.getId(), email, expiresAt
        );
    }

    @Transactional
    public GuardianAccountAcceptedResponse acceptInvitation(
            AcceptGuardianInvitationRequest request
    ) {
        String tokenHash = tokenService.hashToken(request.token());

        GuardianInvitation invitation = invitationRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() ->
                        new BusinessRuleViolationException(
                                "Invitation is invalid or expired"
                        ));

        OffsetDateTime now = OffsetDateTime.now();

        if (!invitation.isPendingAt(now)) {
            throw new BusinessRuleViolationException(
                    "Invitation is invalid or expired"
            );
        }

        Guardian guardian = invitation.getGuardian();

        if (!guardian.isActive()) {
            throw new BusinessRuleViolationException(
                    "This guardian record is inactive"
            );
        }

        if (!java.util.Objects.equals(
                normalizeEmail(guardian.getEmail()),
                invitation.getInvitationEmail())) {
            throw new BusinessRuleViolationException(
                    "Guardian email has changed; request a new invitation"
            );
        }

        if (guardian.getUserAccount() != null) {
            throw new BusinessRuleViolationException(
                    "Guardian already has a linked account"
            );
        }

        String email = invitation.getInvitationEmail();

        if (userAccountRepository.existsByEmail(email)
                || userAccountRepository.existsByUsername(email)) {
            throw new BusinessRuleViolationException(
                    "An account already exists for this email"
            );
        }

        Role guardianRole = roleRepository.findByCode(GUARDIAN_ROLE_CODE)
                .filter(Role::isActive)
                .orElseThrow(() ->
                        new BusinessRuleViolationException(
                                "Guardian role is not configured or inactive"
                        ));

        UserAccount account = UserAccount.builder()
                .username(email)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(guardian.getFirstName())
                .lastName(guardian.getLastName())
                .active(true)
                .build();

        UserAccount savedAccount = userAccountRepository.save(account);

        UserRoleId userRoleId = new UserRoleId(
                savedAccount.getId(), guardianRole.getId()
        );

        userRoleRepository.save(UserRole.builder()
                .id(userRoleId)
                .user(savedAccount)
                .role(guardianRole)
                .build());

        UUID institutionId = guardian.getInstitution().getId();

        if (!scopeRepository.existsByUserIdAndScopeTypeAndScopeId(
                savedAccount.getId(),
                OrganizationScopeType.INSTITUTION,
                institutionId)) {
            scopeRepository.save(UserOrganizationScope.builder()
                    .user(savedAccount)
                    .scopeType(OrganizationScopeType.INSTITUTION)
                    .scopeId(institutionId)
                    .build());
        }

        guardian.setUserAccount(savedAccount);
        guardianRepository.save(guardian);

        invitation.setAcceptedAt(now);
        invitationRepository.save(invitation);

        return new GuardianAccountAcceptedResponse(
                savedAccount.getId(),
                savedAccount.getUsername(),
                "Guardian account created successfully"
        );
    }

    private UserAccount authenticatedAccount(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authenticated user required");
        }

        return userAccountRepository.findById(principal.userId())
                .filter(UserAccount::isActive)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        ));
    }

    private String normalizeEmail(String email) {
        return email == null || email.isBlank()
                ? null
                : email.trim().toLowerCase(Locale.ROOT);
    }
}