package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.InvalidCredentialsException;
import com.school.dolphin.common.exception.InvalidRefreshTokenException;
import com.school.dolphin.identity.config.JwtProperties;
import com.school.dolphin.identity.dto.LoginRequest;
import com.school.dolphin.identity.dto.LoginResponse;
import com.school.dolphin.identity.dto.RefreshTokenRequest;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.entity.UserRefreshToken;
import com.school.dolphin.identity.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;

@Service
public class AuthenticationService {

    private static final String TOKEN_TYPE = "Bearer";

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final LoginAttemptService loginAttemptService;
    private final AuthorizationSnapshotService authorizationSnapshotService;
    private final RefreshTokenService refreshTokenService;

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
            LoginAttemptService loginAttemptService,
            AuthorizationSnapshotService authorizationSnapshotService,
            RefreshTokenService refreshTokenService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.loginAttemptService = loginAttemptService;
        this.authorizationSnapshotService = authorizationSnapshotService;
        this.refreshTokenService = refreshTokenService;
        this.dummyPasswordHash = passwordEncoder.encode(
                "dolphin-nonexistent-account-timing-guard");
    }

    @Transactional
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

        OffsetDateTime now = OffsetDateTime.now();

        AuthorizationSnapshotService.Snapshot snapshot =
                authorizationSnapshotService.load(user.getId());

        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getUsername(),
                snapshot.roleCodes(),
                snapshot.permissionCodes()
        );

        RefreshTokenService.IssuedRefreshToken refreshToken =
                refreshTokenService.issueNewSession(user, now);

        return response(accessToken, refreshToken, user);
    }

    /**
     * Rotates a refresh session and issues a new access token. The refresh row
     * is locked for the duration of the transaction, so two concurrent
     * refreshes cannot both rotate the same token. Current account status and
     * effective permissions are reloaded before any token is minted.
     *
     * <p>{@code noRollbackFor} keeps a reuse-detection family revocation
     * committed even though this method then fails the request.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public LoginResponse refresh(RefreshTokenRequest request) {

        OffsetDateTime now = OffsetDateTime.now();

        UserRefreshToken current = refreshTokenService
                .lockByRawToken(request.refreshToken())
                .orElseThrow(() -> new InvalidRefreshTokenException(
                        "Refresh token is invalid"));

        if (current.isRevoked()) {
            // Replay of a rotated (or logged-out) token: assume theft and
            // revoke the entire session family.
            refreshTokenService.revokeFamily(current.getFamilyId(), now);

            throw new InvalidRefreshTokenException(
                    "Refresh token has already been used");
        }

        if (current.isExpired(now)) {
            throw new InvalidRefreshTokenException(
                    "Refresh token has expired");
        }

        UserAccount user = current.getUser();

        if (!user.isActive()) {
            refreshTokenService.revokeAllForUser(user.getId(), now);

            throw new InvalidRefreshTokenException(
                    "Refresh session is no longer valid");
        }

        AuthorizationSnapshotService.Snapshot snapshot =
                authorizationSnapshotService.load(user.getId());

        RefreshTokenService.IssuedRefreshToken rotated =
                refreshTokenService.rotate(current, now);

        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getUsername(),
                snapshot.roleCodes(),
                snapshot.permissionCodes()
        );

        return response(accessToken, rotated, user);
    }

    /**
     * Revokes the session family that owns the supplied refresh token. Silently
     * succeeds for unknown tokens so logout cannot be used to probe session
     * validity.
     */
    @Transactional
    public void logout(String rawRefreshToken) {

        OffsetDateTime now = OffsetDateTime.now();

        refreshTokenService.lockByRawToken(rawRefreshToken)
                .ifPresent(token -> refreshTokenService.revokeFamily(
                        token.getFamilyId(), now));
    }

    private LoginResponse response(
            String accessToken,
            RefreshTokenService.IssuedRefreshToken refreshToken,
            UserAccount user
    ) {
        return new LoginResponse(
                accessToken,
                TOKEN_TYPE,
                jwtProperties.expirationMs() / 1000,
                refreshToken.token(),
                jwtProperties.refreshExpirationMs() / 1000,
                user.getId(),
                user.getUsername()
        );
    }
}
