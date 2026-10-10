package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.dto.CreatePermissionRequest;
import com.school.dolphin.identity.dto.PermissionResponse;
import com.school.dolphin.identity.entity.Permission;
import com.school.dolphin.identity.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Transactional
    public PermissionResponse create(CreatePermissionRequest request) {

        if (permissionRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException(
                    "Permission code already exists: " + request.code()
            );
        }

        Permission permission = Permission.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .active(true)
                .build();

        Permission savedPermission = permissionRepository.save(permission);

        return toResponse(savedPermission);
    }

    @Transactional(readOnly = true)
    public PermissionResponse getById(UUID id) {

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Permission not found: " + id
                        )
                );

        return toResponse(permission);
    }

    private PermissionResponse toResponse(Permission permission) {

        return new PermissionResponse(
                permission.getId(),
                permission.getCode(),
                permission.getName(),
                permission.getDescription(),
                permission.isActive()
        );
    }
}