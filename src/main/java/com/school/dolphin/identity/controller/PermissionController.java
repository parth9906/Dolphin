package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.CreatePermissionRequest;
import com.school.dolphin.identity.dto.PermissionResponse;
import com.school.dolphin.identity.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionResponse create(
            @Valid @RequestBody CreatePermissionRequest request
    ) {
        return permissionService.create(request);
    }

    @GetMapping("/{id}")
    public PermissionResponse getById(
            @PathVariable UUID id
    ) {
        return permissionService.getById(id);
    }
}