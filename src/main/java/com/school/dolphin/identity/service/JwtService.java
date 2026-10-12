package com.school.dolphin.identity.service;

import com.school.dolphin.identity.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_PERMISSIONS = "permissions";

    private final SecretKey signingKey;
    private final long expirationMs;
    private final String issuer;
    private final String audience;

    public JwtService(JwtProperties properties) {
        String secret = properties.secret();

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is not configured. Set the JWT_SECRET "
                            + "environment variable to a base64-encoded "
                            + "256-bit (or stronger) key.");
        }

        byte[] keyBytes;

        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be valid base64.", exception);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must decode to at least 32 bytes "
                            + "(256 bits).");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = properties.expirationMs();
        this.issuer = properties.issuer();
        this.audience = properties.audience();
    }

    /**
     * Builds a short-lived access token carrying the caller's effective role
     * and permission codes. The snapshot is supplied by
     * {@link AuthorizationSnapshotService} at login/refresh time; the token is
     * never rebuilt from a client-supplied payload.
     */
    public String generateAccessToken(
            UUID userId,
            String username,
            List<String> roleCodes,
            List<String> permissionCodes
    ) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_USERNAME, username)
                .claim(CLAIM_ROLES, List.copyOf(roleCodes))
                .claim(CLAIM_PERMISSIONS, List.copyOf(permissionCodes))
                .issuer(issuer)
                .audience()
                .add(audience)
                .and()
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Verifies the signature, expiration, issuer and audience, then extracts
     * the authenticated identity and authorization snapshot. Malformed or
     * unexpected claim shapes raise {@link JwtException} so the caller can
     * reject the request without trusting client-supplied data.
     */
    public AccessTokenClaims parseAccessToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        UUID userId;

        try {
            userId = UUID.fromString(claims.getSubject());
        } catch (RuntimeException exception) {
            throw new JwtException(
                    "Access token subject is not a valid user id",
                    exception);
        }

        return new AccessTokenClaims(
                userId,
                stringClaim(claims, CLAIM_USERNAME),
                stringListClaim(claims, CLAIM_ROLES),
                stringListClaim(claims, CLAIM_PERMISSIONS)
        );
    }

    private String stringClaim(Claims claims, String name) {
        Object value = claims.get(name);

        if (value instanceof String string && !string.isBlank()) {
            return string;
        }

        throw new JwtException(
                "Access token is missing the '" + name + "' claim");
    }

    private List<String> stringListClaim(Claims claims, String name) {
        Object value = claims.get(name);

        if (value == null) {
            return List.of();
        }

        if (!(value instanceof Collection<?> collection)) {
            throw new JwtException(
                    "Access token claim '" + name + "' is malformed");
        }

        List<String> result = new ArrayList<>(collection.size());

        for (Object element : collection) {
            if (!(element instanceof String string) || string.isBlank()) {
                throw new JwtException(
                        "Access token claim '" + name + "' is malformed");
            }

            result.add(string);
        }

        return List.copyOf(result);
    }

    public record AccessTokenClaims(
            UUID userId,
            String username,
            List<String> roleCodes,
            List<String> permissionCodes
    ) {
    }
}
