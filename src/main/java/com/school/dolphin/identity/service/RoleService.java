package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.dto.CreateRoleRequest;
import com.school.dolphin.identity.dto.RoleResponse;
import com.school.dolphin.identity.entity.Role;
import com.school.dolphin.identity.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    @Transactional
    public RoleResponse create(CreateRoleRequest request) {

        if (roleRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException(
                    "Role code already exists: " + request.code()
            );
        }

        Role role = Role.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .active(true)
                .build();

        Role savedRole = roleRepository.save(role);

        return toResponse(savedRole);
    }

    @Transactional(readOnly = true)
    public RoleResponse getById(UUID id) {

        Role role = roleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + id
                        )
                );

        return toResponse(role);
    }

    private RoleResponse toResponse(Role role) {

        return new RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.isActive()
        );
    }
}