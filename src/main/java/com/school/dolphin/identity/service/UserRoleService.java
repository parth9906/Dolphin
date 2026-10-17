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

    private static final String PLATFORM_ADMIN = "PLATFORM_ADMIN";

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional
    public void assignRole(UUID userId, UUID roleId) {
        // Lock the role first. In particular, all assignments of the
        // PLATFORM_ADMIN role serialize with admin revocation and
        // user deactivation.
        Role role = roleRepository.findByIdForUpdate(roleId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + roleId));

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId));

        if (!user.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign a role to an inactive user");
        }

        if (!role.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot assign an inactive role");
        }

        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
            throw new DuplicateResourceException(
                    "Role is already assigned to this user");
        }

        UserRole userRole = UserRole.builder()
                .id(new UserRoleId(userId, roleId))
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);
    }

    @Transactional
    public void revokeRole(UUID userId, UUID roleId) {
        // Acquire the shared role lock before performing the last-admin
        // count, so concurrent revocations cannot both pass that check.
        Role role = roleRepository.findByIdForUpdate(roleId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found: " + roleId));

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + userId));

        UserRole userRole = userRoleRepository.findById(
                        new UserRoleId(userId, roleId))
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role is not assigned to this user"));

        if (PLATFORM_ADMIN.equals(role.getCode()) && user.isActive()) {
            long activePlatformAdmins = userRoleRepository
                    .countByRole_IdAndUser_ActiveTrue(roleId);

            if (activePlatformAdmins <= 1) {
                throw new BusinessRuleViolationException(
                        "Cannot revoke the last active PLATFORM_ADMIN role");
            }
        }

        userRoleRepository.delete(userRole);
    }
}