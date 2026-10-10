package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.CreateRoleRequest;
import com.school.dolphin.identity.dto.RoleResponse;
import com.school.dolphin.identity.service.RolePermissionService;
import com.school.dolphin.identity.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final RolePermissionService rolePermissionService;

    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(
            @Valid @RequestBody CreateRoleRequest request
    ) {
        return roleService.create(request);
    }

    @PreAuthorize("hasAuthority('ROLE_READ')")
    @GetMapping("/{id}")
    public RoleResponse getById(
            @PathVariable UUID id
    ) {
        return roleService.getById(id);
    }

    @PostMapping("/{roleId}/permissions/{permissionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assignPermission(
            @PathVariable UUID roleId,
            @PathVariable UUID permissionId
    ) {
        rolePermissionService.assignPermission(roleId, permissionId);
    }
}