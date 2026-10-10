package com.school.dolphin.identity.security;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.school.dolphin.identity.entity.RolePermission;
import com.school.dolphin.identity.entity.UserRole;
import com.school.dolphin.identity.repository.RolePermissionRepository;
import com.school.dolphin.identity.repository.UserRoleRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserAccountRepository userAccountRepository,
            UserRoleRepository userRoleRepository,
            RolePermissionRepository rolePermissionRepository
    ) {
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        try {
            Claims claims = jwtService.parseToken(token);
            UUID userId = UUID.fromString(claims.getSubject());

            Optional<UserAccount> optionalUser =
                    userAccountRepository.findById(userId);

            if (optionalUser.isPresent()
                    && optionalUser.get().isActive()
                    && SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                UserAccount user = optionalUser.get();

                AuthenticatedUser principal = new AuthenticatedUser(
                        user.getId(),
                        user.getUsername()
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                new ArrayList<>(loadAuthorities(user.getId()))
                        );

                authentication.setDetails(
                        new org.springframework.security.web.authentication
                                .WebAuthenticationDetailsSource()
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


    private Set<GrantedAuthority> loadAuthorities(UUID userId) {

        Set<GrantedAuthority> authorities = new HashSet<>();

        List<UserRole> userRoles =
                userRoleRepository.findActiveRolesByUserId(userId);

        for (UserRole userRole : userRoles) {

            var role = userRole.getRole();

            // Example: ROLE_TEACHER
            authorities.add(
                    new SimpleGrantedAuthority("ROLE_" + role.getCode())
            );

            List<RolePermission> rolePermissions =
                    rolePermissionRepository
                            .findActivePermissionsByRoleId(role.getId());

            for (RolePermission rolePermission : rolePermissions) {

                // Example: STUDENT_READ
                authorities.add(
                        new SimpleGrantedAuthority(
                                rolePermission.getPermission().getCode()
                        )
                );
            }
        }

        return authorities;
    }
}