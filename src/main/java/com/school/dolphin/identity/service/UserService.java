package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.dto.CreateUserRequest;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

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