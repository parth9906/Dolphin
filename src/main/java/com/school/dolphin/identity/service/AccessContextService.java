package com.school.dolphin.identity.service;

import com.school.dolphin.identity.dto.AccessContextResponse;
import com.school.dolphin.identity.entity.UserOrganizationScope;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.repository.UserOrganizationScopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessContextService {

    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final AuthorizationSnapshotService authorizationSnapshotService;
    private final UserOrganizationScopeRepository scopeRepository;

    @Transactional(readOnly = true)
    public AccessContextResponse getCurrentAccessContext(
            Authentication authentication
    ) {
        var user = authenticatedUserResolver.requireUserAccount(authentication);

        if (!user.isActive()) {
            throw new AccessDeniedException(
                    "Inactive users cannot access their access context"
            );
        }

        var snapshot = authorizationSnapshotService.load(user.getId());

        List<AccessContextResponse.AccessScopeResponse> scopes =
                scopeRepository.findByUser_Id(user.getId())
                        .stream()
                        .map(this::toAccessScopeResponse)
                        .toList();

        return new AccessContextResponse(
                user.getId(),
                user.getUsername(),
                List.copyOf(snapshot.roleCodes()),
                List.copyOf(snapshot.permissionCodes()),
                scopes
        );
    }

    private AccessContextResponse.AccessScopeResponse
    toAccessScopeResponse(UserOrganizationScope scope) {
        return new AccessContextResponse.AccessScopeResponse(
                scope.getScopeType().name(),
                scope.getScopeId()
        );
    }
}