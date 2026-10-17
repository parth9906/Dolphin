package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.StudentPromotionBatchItem;
import com.school.dolphin.academic.entity.StudentPromotionDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentPromotionBatchItemRepository
        extends JpaRepository<StudentPromotionBatchItem, UUID> {

    List<StudentPromotionBatchItem> findByBatch_IdOrderByStudent_AdmissionNumberAsc(
            UUID batchId);

    Optional<StudentPromotionBatchItem> findByBatch_IdAndStudent_Id(
            UUID batchId,
            UUID studentId);

    long countByBatch_Id(UUID batchId);

    long countByBatch_IdAndDecision(
            UUID batchId,
            StudentPromotionDecision decision);

    List<StudentPromotionBatchItem> findByStudent_IdOrderByCreatedAtDesc(
            UUID studentId);
}