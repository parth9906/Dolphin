package com.school.dolphin.identity.service;

import com.school.dolphin.identity.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

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
    }

    public String generateToken(UUID userId, String username) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
