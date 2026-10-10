
package com.school.dolphin.assessment.repository;

import com.school.dolphin.assessment.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AssessmentRepository
        extends JpaRepository<Assessment, UUID> {

    Optional<Assessment> findByIdAndActiveTrue(UUID id);
}