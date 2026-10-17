
package com.school.dolphin.identity.repository;

import com.school.dolphin.identity.entity.OrganizationScopeType;
import com.school.dolphin.identity.entity.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository
        extends JpaRepository<UserAccount, UUID> {

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    /*
     * General user directory.
     *
     * Scope filtering matches users explicitly assigned to the selected
     * scope. Organization authorization must be checked by the service
     * before this query is executed.
     */
    @Query(
            value = """
                    SELECT u
                    FROM UserAccount u
                    WHERE (:active IS NULL OR u.active = :active)
                      AND (
                          :search = ''
                          OR LOWER(u.username)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.email)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.firstName)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(COALESCE(u.lastName, ''))
                             LIKE LOWER(CONCAT('%', :search, '%'))
                      )
                      AND (
                          :scopeType IS NULL
                          OR EXISTS (
                              SELECT s.id
                              FROM UserOrganizationScope s
                              WHERE s.user.id = u.id
                                AND s.scopeType = :scopeType
                                AND s.scopeId = :scopeId
                          )
                      )
                    """,
            countQuery = """
                    SELECT COUNT(u)
                    FROM UserAccount u
                    WHERE (:active IS NULL OR u.active = :active)
                      AND (
                          :search = ''
                          OR LOWER(u.username)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.email)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.firstName)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(COALESCE(u.lastName, ''))
                             LIKE LOWER(CONCAT('%', :search, '%'))
                      )
                      AND (
                          :scopeType IS NULL
                          OR EXISTS (
                              SELECT s.id
                              FROM UserOrganizationScope s
                              WHERE s.user.id = u.id
                                AND s.scopeType = :scopeType
                                AND s.scopeId = :scopeId
                          )
                      )
                    """
    )
    Page<UserAccount> searchDirectory(
            @Param("search") String search,
            @Param("active") Boolean active,
            @Param("scopeType") OrganizationScopeType scopeType,
            @Param("scopeId") UUID scopeId,
            Pageable pageable
    );

    /*
     * Existing student-account linking query.
     * Preserve its behavior.
     */
    @Query(
            value = """
                    SELECT u
                    FROM UserAccount u
                    WHERE u.active = true
                      AND (
                          :search = ''
                          OR LOWER(u.username)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.email)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.firstName)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(COALESCE(u.lastName, ''))
                             LIKE LOWER(CONCAT('%', :search, '%'))
                      )
                      AND NOT EXISTS (
                          SELECT l.id
                          FROM StudentAccountLink l
                          WHERE l.userAccount.id = u.id
                      )
                      AND NOT EXISTS (
                          SELECT sm.id
                          FROM StaffMember sm
                          WHERE sm.userAccount.id = u.id
                      )
                      AND NOT EXISTS (
                          SELECT g.id
                          FROM Guardian g
                          WHERE g.userAccount.id = u.id
                      )
                    """,
            countQuery = """
                    SELECT COUNT(u)
                    FROM UserAccount u
                    WHERE u.active = true
                      AND (
                          :search = ''
                          OR LOWER(u.username)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.email)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(u.firstName)
                             LIKE LOWER(CONCAT('%', :search, '%'))
                          OR LOWER(COALESCE(u.lastName, ''))
                             LIKE LOWER(CONCAT('%', :search, '%'))
                      )
                      AND NOT EXISTS (
                          SELECT l.id
                          FROM StudentAccountLink l
                          WHERE l.userAccount.id = u.id
                      )
                      AND NOT EXISTS (
                          SELECT sm.id
                          FROM StaffMember sm
                          WHERE sm.userAccount.id = u.id
                      )
                      AND NOT EXISTS (
                          SELECT g.id
                          FROM Guardian g
                          WHERE g.userAccount.id = u.id
                      )
                    """
    )
    Page<UserAccount> searchEligibleAccounts(
            @Param("search") String search,
            Pageable pageable
    );
}
