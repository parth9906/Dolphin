
package com.school.dolphin.guardian.repository;

import com.school.dolphin.guardian.entity.GuardianInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuardianInvitationRepository
        extends JpaRepository<GuardianInvitation, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT i
        FROM GuardianInvitation i
        JOIN FETCH i.guardian g
        JOIN FETCH g.institution
        WHERE i.tokenHash = :tokenHash
        """)
    Optional<GuardianInvitation> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );

    List<GuardianInvitation> findByGuardian_IdAndAcceptedAtIsNullAndRevokedAtIsNull(
            UUID guardianId
    );
}