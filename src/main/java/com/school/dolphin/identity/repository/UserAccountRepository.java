
package com.school.dolphin.identity.repository;

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

    @Query(
            value = """
            SELECT u
            FROM UserAccount u
            WHERE u.active = true
              AND (
                  :search = ''
                  OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
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
                  OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
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
