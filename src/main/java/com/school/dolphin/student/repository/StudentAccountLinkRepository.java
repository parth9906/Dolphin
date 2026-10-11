package com.school.dolphin.student.repository;

import com.school.dolphin.student.entity.StudentAccountLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StudentAccountLinkRepository
        extends JpaRepository<StudentAccountLink, UUID> {

    Optional<StudentAccountLink> findByUserAccount_Id(UUID userAccountId);
}