package com.school.dolphin.organization.repository;

import com.school.dolphin.organization.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegionRepository extends JpaRepository<Region, UUID> {

    boolean existsByEnterpriseIdAndCode(
            UUID enterpriseId,
            String code
    );

    List<Region> findAllByEnterpriseId(UUID enterpriseId);
}