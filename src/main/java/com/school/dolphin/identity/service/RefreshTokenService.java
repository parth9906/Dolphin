package com.school.dolphin.identity.service;

import com.school.dolphin.identity.config.JwtProperties;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.entity.UserRefreshToken;
import com.school.dolphin.identity.repository.UserRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Owns refresh-session mechanics: cryptographically random token generation,
 * SHA-256 hashing for storage, rotation, and family revocation.
 *
 * <p>A "family" is one login session. Rotation revokes the presented row and
 * links it to its successor; replaying any already-rotated token revokes the
 * whole family (theft detection). All write methods require an active
 * transaction so rotation is atomic with the surrounding refresh workflow.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;

    private final UserRefreshTokenRepository repository;
    private final JwtProperties jwtProperties;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public IssuedRefreshToken issueNewSession(
            UserAccount user,
            OffsetDateTime now
    ) {
        return issued(createToken(user, UUID.randomUUID(), now));
    }

    @Transactional
    public IssuedRefreshToken rotate(
            UserRefreshToken current,
            OffsetDateTime now
    ) {
        CreatedToken successor = createToken(
                current.getUser(), current.getFamilyId(), now);

        current.setRevokedAt(now);
        current.setRotatedAt(now);
        current.setReplacedBy(successor.token());

        repository.save(current);

        return issued(successor);
    }

    /**
     * Locks the refresh row for the duration of the caller's transaction so
     * concurrent refreshes serialize; the loser observes the row as revoked.
     */
    @Transactional
    public Optional<UserRefreshToken> lockByRawToken(String rawToken) {
        return repository.findByTokenHashForUpdate(hashToken(rawToken));
    }

    @Transactional
    public void revokeFamily(UUID familyId, OffsetDateTime now) {
        repository.revokeFamily(familyId, now);
    }

    @Transactional
    public void revokeAllForUser(UUID userId, OffsetDateTime now) {
        repository.revokeAllForUser(userId, now);
    }

    private CreatedToken createToken(
            UserAccount user,
            UUID familyId,
            OffsetDateTime now
    ) {
        String rawToken = generateToken();
        OffsetDateTime expiresAt = now.plusMillis(
                jwtProperties.refreshExpirationMs());

        UserRefreshToken token = UserRefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .familyId(familyId)
                .expiresAt(expiresAt)
                .build();

        UserRefreshToken saved = repository.save(token);

        return new CreatedToken(saved, rawToken);
    }

    private IssuedRefreshToken issued(CreatedToken created) {
        return new IssuedRefreshToken(
                created.rawToken(),
                created.token().getId(),
                created.token().getExpiresAt()
        );
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is unavailable", exception);
        }
    }

    public record IssuedRefreshToken(
            String token,
            UUID id,
            OffsetDateTime expiresAt
    ) {
    }

    private record CreatedToken(
            UserRefreshToken token,
            String rawToken
    ) {
    }
}
