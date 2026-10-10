
package com.school.dolphin.guardian.repository;

import com.school.dolphin.guardian.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuardianRepository
        extends JpaRepository<Guardian, UUID> {

    Optional<Guardian> findByIdAndActiveTrue(UUID id);

    List<Guardian> findByInstitution_IdAndActiveTrue(UUID institutionId);

    boolean existsByUserAccount_Id(UUID userAccountId);
}