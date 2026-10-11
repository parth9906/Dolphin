package com.school.dolphin.identity.security;

import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserResolver {

    private final UserAccountRepository userAccountRepository;

    public UUID requireUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                instanceof AuthenticatedUser user)) {
            throw new AccessDeniedException("Authenticated user is required");
        }

        return user.userId();
    }

    public UserAccount requireUserAccount(Authentication authentication) {
        UUID userId = requireUserId(authentication);

        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user account not found"));
    }
}
