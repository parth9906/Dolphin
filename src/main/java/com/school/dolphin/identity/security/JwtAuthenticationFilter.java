package com.school.dolphin.identity.security;

import com.school.dolphin.identity.service.JwtService;
import com.school.dolphin.identity.service.JwtService.AccessTokenClaims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Authenticates a request purely from the signed access token. The token is
 * verified locally (signature, expiration, issuer, audience) and the principal
 * plus authorities are built from its claims; this filter performs no database
 * access.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ROLE_PREFIX = "ROLE_";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader(AUTHORIZATION_HEADER);

        // Missing or non-bearer credentials leave the request unauthenticated;
        // public endpoints still succeed and protected ones get 401 later.
        if (authorizationHeader == null
                || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(BEARER_PREFIX.length());

        try {
            AccessTokenClaims claims = jwtService.parseAccessToken(token);

            if (SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                AuthenticatedUser principal = new AuthenticatedUser(
                        claims.userId(),
                        claims.username()
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                toAuthorities(claims)
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (JwtException | IllegalArgumentException exception) {
            // Invalid, expired, or malformed tokens remain unauthenticated.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> toAuthorities(AccessTokenClaims claims) {

        Set<GrantedAuthority> authorities = new LinkedHashSet<>();

        for (String roleCode : claims.roleCodes()) {
            // Example: ROLE_TEACHER
            authorities.add(
                    new SimpleGrantedAuthority(ROLE_PREFIX + roleCode)
            );
        }

        for (String permissionCode : claims.permissionCodes()) {
            // Example: STUDENT_READ
            authorities.add(new SimpleGrantedAuthority(permissionCode));
        }

        return new ArrayList<>(authorities);
    }
}
