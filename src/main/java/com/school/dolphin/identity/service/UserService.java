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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticatedUserResolver authenticatedUserResolver;

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
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId
                        ));

        if (user.isActive()) {
            user.setActive(false);
            userAccountRepository.save(user);
        }

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
