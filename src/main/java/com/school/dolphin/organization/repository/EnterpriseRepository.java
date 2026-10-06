package com.school.dolphin.organization.repository;

import com.school.dolphin.organization.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EnterpriseRepository extends JpaRepository<Enterprise, UUID> {

    boolean existsByCode(String code);
}