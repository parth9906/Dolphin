package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.identity.dto.CreateUserRequest;
import com.school.dolphin.identity.dto.ChangePasswordRequest;
import com.school.dolphin.identity.dto.UpdateUserRequest;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;
import com.school.dolphin.identity.entity.Role;
import com.school.dolphin.identity.repository.RoleRepository;
import com.school.dolphin.identity.repository.UserRoleRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String PLATFORM_ADMIN = "PLATFORM_ADMIN";

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final RefreshTokenService refreshTokenService;
    private final StudentRepository studentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public UserResponse create(CreateUserRequest request) {

        if (userAccountRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException(
                    "Username already exists: " + request.username()
            );
        }

        if (userAccountRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException(
                    "Email already exists: " + request.email()
            );
        }

        UserAccount user = UserAccount.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .active(true)
                .build();

        UserAccount savedUser = userAccountRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {

        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + id
                        )
                );

        return toResponse(user);
    }

    @Transactional
    public UserResponse update(
            UUID userId,
            UpdateUserRequest request
    ) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId
                        ));

        String email = request.email().trim();

        if (userAccountRepository.existsByEmailAndIdNot(email, userId)) {
            throw new DuplicateResourceException(
                    "Email already exists: " + email
            );
        }

        user.setEmail(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(
                request.lastName() == null
                        ? null
                        : request.lastName().trim()
        );

        return toResponse(userAccountRepository.save(user));
    }

    @Transactional
    public UserResponse deactivate(UUID userId) {
        // Keep the admin role locked while checking and changing the
        // active-account invariant.
        Role platformAdminRole = roleRepository
                .findByCodeForUpdate(PLATFORM_ADMIN)
                .orElse(null);

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId));

        if (user.isActive()) {
            boolean isPlatformAdmin = platformAdminRole != null
                    && userRoleRepository.existsByUserIdAndRoleId(
                    userId, platformAdminRole.getId());

            if (isPlatformAdmin) {
                long activePlatformAdmins = userRoleRepository
                        .countByRole_IdAndUser_ActiveTrue(
                                platformAdminRole.getId());

                if (activePlatformAdmins <= 1) {
                    throw new BusinessRuleViolationException(
                            "Cannot deactivate the last active PLATFORM_ADMIN");
                }
            }

            user.setActive(false);
            userAccountRepository.save(user);
        }

        // Preserve existing session-revocation behavior.
        refreshTokenService.revokeAllForUser(
                user.getId(), OffsetDateTime.now());

        return toResponse(user);
    }

    @Transactional
    public void changeOwnPassword(
            Authentication authentication,
            ChangePasswordRequest request
    ) {
        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash())) {
            throw new BusinessRuleViolationException(
                    "Current password is incorrect");
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword()));

        userAccountRepository.save(user);

        // Force re-authentication of every refresh session for this account.
        refreshTokenService.revokeAllForUser(
                user.getId(), OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> searchEligibleAccounts(
            UUID studentId,
            String search,
            Pageable pageable,
            Authentication authentication
    ) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        if (!student.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot link an account to an inactive student");
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication,
                student.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this student's institution");
        }

        int safePageSize = Math.min(pageable.getPageSize(), 100);

        Pageable safePageable = PageRequest.of(
                pageable.getPageNumber(),
                safePageSize,
                pageable.getSort()
        );

        String searchTerm = search == null || search.isBlank()
                ? ""
                : search.trim();

        return userAccountRepository
                .searchEligibleAccounts(searchTerm, safePageable)
                .map(this::toResponse);
    }

    private UserResponse toResponse(UserAccount user) {

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isActive()
        );
    }
}
