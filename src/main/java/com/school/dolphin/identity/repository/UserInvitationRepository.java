
package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.UserInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserInvitationRepository
        extends JpaRepository<UserInvitation, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT i
            FROM UserInvitation i
            JOIN FETCH i.role
            WHERE i.tokenHash = :tokenHash
            """)
    Optional<UserInvitation> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );

    List<UserInvitation>
    findByInvitationEmailIgnoreCaseAndAcceptedAtIsNullAndRevokedAtIsNull(
            String invitationEmail
    );

    boolean existsByUsernameAndAcceptedAtIsNullAndRevokedAtIsNullAndExpiresAtAfter(
            String username,
            OffsetDateTime now
    );
}
