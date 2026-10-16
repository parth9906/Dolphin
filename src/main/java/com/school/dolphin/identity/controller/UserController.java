package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.CreateOrganizationScopeRequest;
import com.school.dolphin.identity.dto.CreateUserRequest;
import com.school.dolphin.identity.dto.OrganizationScopeResponse;
import com.school.dolphin.identity.dto.UpdateUserRequest;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.service.UserOrganizationScopeService;
import com.school.dolphin.identity.service.UserRoleService;
import com.school.dolphin.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRoleService userRoleService;
    private final UserOrganizationScopeService userOrganizationScopeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public UserResponse create(
            @Valid @RequestBody CreateUserRequest request
    ) {
        return userService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public UserResponse getById(
            @PathVariable UUID id
    ) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public UserResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('USER_DEACTIVATE')")
    public UserResponse deactivate(
            @PathVariable UUID id
    ) {
        return userService.deactivate(id);
    }

    @PostMapping("/{userId}/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('USER_ROLE_ASSIGN')")
    public void assignRole(
            @PathVariable UUID userId,
            @PathVariable UUID roleId
    ) {
        userRoleService.assignRole(userId, roleId);
    }

    @PostMapping("/{userId}/scopes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('USER_SCOPE_ASSIGN')")
    public OrganizationScopeResponse assignScope(
            @PathVariable UUID userId,
            @Valid @RequestBody CreateOrganizationScopeRequest request
    ) {
        return userOrganizationScopeService.assignScope(userId, request);
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
                studentId,
                search,
                pageable,
                authentication
        );
    }

}
