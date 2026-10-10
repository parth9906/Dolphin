package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.entity.Role;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.entity.UserRole;
import com.school.dolphin.identity.entity.UserRoleId;
import com.school.dolphin.identity.repository.RoleRepository;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserRoleService {

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional
    public void assignRole(
            UUID userId,
            UUID roleId
    ) {

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId
                        )
                );

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + roleId
                        )
                );

        if (!user.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign role to inactive user"
            );
        }

        if (!role.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign inactive role"
            );
        }

        if (userRoleRepository.existsByUserIdAndRoleId(
                userId,
                roleId
        )) {
            throw new DuplicateResourceException(
                    "Role is already assigned to this user"
            );
        }

        UserRole userRole = UserRole.builder()
                .id(new UserRoleId(userId, roleId))
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);
    }
}