package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    boolean existsByCode(String code);

    Optional<Role> findByCode(String code);
}