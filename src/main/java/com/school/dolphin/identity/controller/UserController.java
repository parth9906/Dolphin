package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.CreateOrganizationScopeRequest;
import com.school.dolphin.identity.dto.CreateUserRequest;
import com.school.dolphin.identity.dto.OrganizationScopeResponse;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.service.UserOrganizationScopeService;
import com.school.dolphin.identity.service.UserRoleService;
import com.school.dolphin.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public UserResponse create(
            @Valid @RequestBody CreateUserRequest request
    ) {
        return userService.create(request);
    }

    @GetMapping("/{id}")
    public UserResponse getById(
            @PathVariable UUID id
    ) {
        return userService.getById(id);
    }

    @PostMapping("/{userId}/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignRole(
            @PathVariable UUID userId,
            @PathVariable UUID roleId
    ) {
        userRoleService.assignRole(userId, roleId);
    }

    @PostMapping("/{userId}/scopes")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationScopeResponse assignScope(
            @PathVariable UUID userId,
            @Valid @RequestBody CreateOrganizationScopeRequest request
    ) {
        return userOrganizationScopeService.assignScope(userId, request);
    }
}