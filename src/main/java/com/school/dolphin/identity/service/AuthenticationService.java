package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.InvalidCredentialsException;
import com.school.dolphin.identity.config.JwtProperties;
import com.school.dolphin.identity.dto.LoginRequest;
import com.school.dolphin.identity.dto.LoginResponse;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthenticationService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final LoginAttemptService loginAttemptService;

    /**
     * A valid encoded hash used only to equalize the work done for unknown
     * usernames, so response timing does not reveal whether an account exists.
     */
    private final String dummyPasswordHash;

    public AuthenticationService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            LoginAttemptService loginAttemptService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.loginAttemptService = loginAttemptService;
        this.dummyPasswordHash = passwordEncoder.encode(
                "dolphin-nonexistent-account-timing-guard");
    }

    public LoginResponse authenticate(LoginRequest request) {

        String attemptKey = request.username() == null
                ? ""
                : request.username().trim().toLowerCase(Locale.ROOT);

        loginAttemptService.assertNotLocked(attemptKey);

        UserAccount user = userAccountRepository
                .findByUsername(request.username())
                .orElse(null);

        boolean passwordMatches = passwordEncoder.matches(
                request.password(),
                user != null ? user.getPasswordHash() : dummyPasswordHash);

        if (user == null || !user.isActive() || !passwordMatches) {
            loginAttemptService.recordFailure(attemptKey);

            // A single generic message prevents username/account enumeration.
            throw new InvalidCredentialsException(
                    "Invalid username or password");
        }

        loginAttemptService.reset(attemptKey);

        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername()
        );

        return new LoginResponse(
                token,
                "Bearer",
                jwtProperties.expirationMs() / 1000,
                user.getId(),
                user.getUsername()
        );
    }
}
