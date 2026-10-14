package com.school.dolphin.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class SecurityUtils {

    private SecurityUtils() {
        // Utility class
    }

    public static boolean isPlatformAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().contains(
                new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN")
        );
    }
}
