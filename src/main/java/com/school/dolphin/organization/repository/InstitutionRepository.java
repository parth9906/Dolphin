package com.school.dolphin.organization.repository;

import com.school.dolphin.organization.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InstitutionRepository extends JpaRepository<Institution, UUID> {

    boolean existsByClusterIdAndCode(UUID clusterId, String code);
}