
package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.CreateOrganizationScopeRequest;
import com.school.dolphin.identity.dto.CreateUserRequest;
import com.school.dolphin.identity.dto.OrganizationScopeResponse;
import com.school.dolphin.identity.dto.RoleResponse;
import com.school.dolphin.identity.dto.UpdateUserRequest;
import com.school.dolphin.identity.dto.UserOrganizationScopeDetailsResponse;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.entity.OrganizationScopeType;
import com.school.dolphin.identity.service.UserAdministrationService;
import com.school.dolphin.identity.service.UserOrganizationScopeService;
import com.school.dolphin.identity.service.UserRoleService;
import com.school.dolphin.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private static final Set<String> DIRECTORY_SORT_FIELDS = Set.of(
            "id", "username", "email", "firstName", "lastName",
            "active", "createdAt", "updatedAt"
    );

    private final UserService userService;
    private final UserRoleService userRoleService;
    private final UserOrganizationScopeService userOrganizationScopeService;
    private final UserAdministrationService userAdministrationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public UserResponse create(
            @Valid @RequestBody CreateUserRequest request
    ) {
        return userService.create(request);
    }

    @GetMapping("/directory")
    @PreAuthorize("hasAuthority('USER_READ')")
    public Page<UserResponse> directory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) OrganizationScopeType scopeType,
            @RequestParam(required = false) UUID scopeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Sort sort,
            Authentication authentication
    ) {
        if ((scopeType == null) != (scopeId == null)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "scopeType and scopeId must be provided together"
            );
        }

        return userAdministrationService.directory(
                search,
                active,
                scopeType,
                scopeId,
                safePageable(page, size, sort),
                authentication
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public UserResponse getById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        userAdministrationService.assertUserAccessible(id, authentication);
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public UserResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        userAdministrationService.assertUserAccessible(id, authentication);
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('USER_DEACTIVATE')")
    public UserResponse deactivate(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        userAdministrationService.assertUserAccessible(id, authentication);
        return userService.deactivate(id);
    }

    @PostMapping("/{userId}/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('USER_ROLE_ASSIGN')")
    public void assignRole(
            @PathVariable UUID userId,
            @PathVariable UUID roleId,
            Authentication authentication
    ) {
        userAdministrationService.assertUserAccessible(userId, authentication);
        userRoleService.assignRole(userId, roleId);
    }

    @GetMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<RoleResponse> getRoles(
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        return userAdministrationService.getUserRoles(userId, authentication);
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('USER_ROLE_REVOKE')")
    public void revokeRole(
            @PathVariable UUID userId,
            @PathVariable UUID roleId,
            Authentication authentication
    ) {
        userAdministrationService.revokeRole(
                userId, roleId, authentication
        );
    }

    @PostMapping("/{userId}/scopes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('USER_SCOPE_ASSIGN')")
    public OrganizationScopeResponse assignScope(
            @PathVariable UUID userId,
            @Valid @RequestBody CreateOrganizationScopeRequest request,
            Authentication authentication
    ) {
        userAdministrationService.assertUserCanReceiveScope(
                userId,
                request.scopeType(),
                request.scopeId(),
                authentication
        );

        return userOrganizationScopeService.assignScope(userId, request);
    }

    @GetMapping("/{userId}/scopes")
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<UserOrganizationScopeDetailsResponse> getScopes(
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        return userAdministrationService.getUserScopes(userId, authentication);
    }

    @DeleteMapping("/{userId}/scopes/{scopeType}/{scopeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('USER_SCOPE_REVOKE')")
    public void revokeScope(
            @PathVariable UUID userId,
            @PathVariable OrganizationScopeType scopeType,
            @PathVariable UUID scopeId,
            Authentication authentication
    ) {
        userAdministrationService.revokeScope(
                userId, scopeType, scopeId, authentication
        );
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public Page<UserResponse> searchEligibleAccounts(
            @RequestParam UUID studentId,
            @RequestParam(required = false) String search,
            @PageableDefault(
                    size = 20,
                    sort = "username",
                    direction = Sort.Direction.ASC
            ) Pageable pageable,
            Authentication authentication
    ) {
        return userService.searchEligibleAccounts(
                studentId, search, pageable, authentication
        );
    }

    private Pageable safePageable(int page, int size, Sort sort) {
        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be zero or greater"
            );
        }

        if (size < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page size must be at least 1"
            );
        }

        Sort requested = sort == null || sort.isUnsorted()
                ? Sort.by(Sort.Order.asc("username"))
                : sort;

        for (Sort.Order order : requested) {
            if (!DIRECTORY_SORT_FIELDS.contains(order.getProperty())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported sort field: " + order.getProperty()
                );
            }
        }

        if (requested.getOrderFor("id") == null) {
            requested = requested.and(Sort.by(Sort.Order.asc("id")));
        }

        return PageRequest.of(
                page,
                Math.min(size, 100),
                requested
        );
    }
}
