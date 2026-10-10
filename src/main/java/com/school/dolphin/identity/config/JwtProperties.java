package com.school.dolphin.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dolphin.security.jwt")
public record JwtProperties(
        String secret,
        long expirationMs
) {
}