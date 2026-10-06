package com.school.dolphin.organization.repository;

import com.school.dolphin.organization.entity.Campus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CampusRepository extends JpaRepository<Campus, UUID> {

    boolean existsByInstitutionIdAndCode(UUID institutionId, String code);
}