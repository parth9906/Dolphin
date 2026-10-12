package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.UserRefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserRefreshTokenRepository
        extends JpaRepository<UserRefreshToken, UUID> {

    /**
     * Loads a refresh token with a row lock so two concurrent refresh requests
     * cannot both rotate the same token. The second waiter observes the row
     * after the first transaction commits and therefore sees it revoked.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM UserRefreshToken t WHERE t.tokenHash = :tokenHash")
    Optional<UserRefreshToken> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE UserRefreshToken t
        SET t.revokedAt = :revokedAt
        WHERE t.familyId = :familyId
          AND t.revokedAt IS NULL
    """)
    int revokeFamily(
            @Param("familyId") UUID familyId,
            @Param("revokedAt") OffsetDateTime revokedAt
    );

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE UserRefreshToken t
        SET t.revokedAt = :revokedAt
        WHERE t.user.id = :userId
          AND t.revokedAt IS NULL
    """)
    int revokeAllForUser(
            @Param("userId") UUID userId,
            @Param("revokedAt") OffsetDateTime revokedAt
    );
}
