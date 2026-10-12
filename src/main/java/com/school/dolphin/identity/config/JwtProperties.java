package com.school.dolphin.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dolphin.security.jwt")
public record JwtProperties(
        String secret,
        long expirationMs,
        long refreshExpirationMs,
        String issuer,
        String audience
) {

    private static final long DEFAULT_REFRESH_EXPIRATION_MS =
            30L * 24 * 60 * 60 * 1000;

    public JwtProperties {

        if (issuer == null || issuer.isBlank()) {
            issuer = "dolphin";
        }

        if (audience == null || audience.isBlank()) {
            audience = "dolphin-api";
        }

        if (refreshExpirationMs <= 0) {
            refreshExpirationMs = DEFAULT_REFRESH_EXPIRATION_MS;
        }
    }
}
