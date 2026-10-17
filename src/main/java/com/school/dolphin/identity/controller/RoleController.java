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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;

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
    @PreAuthorize("hasAuthority('ROLE_PERMISSION_ASSIGN')")
    public void assignPermission(
            @PathVariable UUID roleId,
            @PathVariable UUID permissionId
    ) {
        rolePermissionService.assignPermission(roleId, permissionId);
    }


    @PreAuthorize("hasAuthority('ROLE_READ')")
    @GetMapping
    public Page<RoleResponse> searchRoles(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "code") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("Page must be zero or greater");
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Size must be between 1 and 100");
        }

        // Only permit known entity fields for sorting.
        String safeSortBy = switch (sortBy) {
            case "code", "name", "createdAt", "updatedAt" -> sortBy;
            default -> "code";
        };

        Sort.Direction direction =
                "desc".equalsIgnoreCase(sortDirection)
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(direction, safeSortBy)
        );

        return roleService.search(search, active, pageable);
    }

}
