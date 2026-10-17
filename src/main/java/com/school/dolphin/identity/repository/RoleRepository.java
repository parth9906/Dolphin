
package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    boolean existsByCode(String code);

    Optional<Role> findByCode(String code);

    @Query(
            value = """
            SELECT r
            FROM Role r
            WHERE (:active IS NULL OR r.active = :active)
              AND (
                    :search = ''
                    OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(r.description, ''))
                       LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """,
            countQuery = """
            SELECT COUNT(r)
            FROM Role r
            WHERE (:active IS NULL OR r.active = :active)
              AND (
                    :search = ''
                    OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(r.description, ''))
                       LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """
    )
    Page<Role> searchRoles(
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Role r WHERE r.id = :roleId")
    Optional<Role> findByIdForUpdate(
            @Param("roleId") UUID roleId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Role r WHERE r.code = :code")
    Optional<Role> findByCodeForUpdate(
            @Param("code") String code
    );
}
