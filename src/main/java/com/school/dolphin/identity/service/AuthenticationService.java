package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.config.JwtProperties;
import com.school.dolphin.identity.dto.LoginRequest;
import com.school.dolphin.identity.dto.LoginResponse;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public LoginResponse authenticate(LoginRequest request) {

        UserAccount user = userAccountRepository
                .findByUsername(request.username())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Invalid username or password"
                        )
                );

        if (!user.isActive()) {
            throw new BusinessRuleViolationException(
                    "User account is inactive"
            );
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new ResourceNotFoundException(
                    "Invalid username or password"
            );
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername()
        );

        return new LoginResponse(
                token,
                "Bearer",
                jwtProperties.expirationMs()/1000,
                user.getId(),
                user.getUsername()
        );
    }
}