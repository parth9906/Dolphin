package com.school.dolphin.staff.repository;

import com.school.dolphin.staff.entity.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StaffMemberRepository
        extends JpaRepository<StaffMember, UUID> {
    Optional<StaffMember> findByUserAccount_Id(UUID userAccountId);

    boolean existsByUserAccount_Id(UUID userAccountId);

    Optional<StaffMember> findByIdAndUserAccountIsNull(UUID id);
}
