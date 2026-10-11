package com.school.dolphin.attendance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.school.dolphin.attendance.entity.AttendanceAlert;

public interface AttendanceAlertRepository
        extends JpaRepository<AttendanceAlert, UUID> {

    boolean existsByStudent_IdAndPeriodStartAndPeriodEndAndThresholdPercent(
            UUID studentId,
            java.time.LocalDate periodStart,
            java.time.LocalDate periodEnd,
            java.math.BigDecimal thresholdPercent);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AttendanceAlert a WHERE a.id = :alertId")
    Optional<AttendanceAlert> findByIdForUpdate(
            @Param("alertId") UUID alertId
    );


    List<AttendanceAlert>
    findByStudent_IdOrderByGeneratedAtDesc(UUID studentId);

    List<AttendanceAlert>
    findByStudent_IdAndStatusOrderByGeneratedAtDesc(
            UUID studentId,
            String status);

    List<AttendanceAlert>
    findByInstitution_IdAndStatusOrderByGeneratedAtDesc(
            UUID institutionId,
            String status);

    @Modifying
    @Query(value = """
    INSERT INTO attendance_alert (
        id,
        student_id,
        institution_id,
        period_start,
        period_end,
        threshold_percent,
        attendance_percent,
        status,
        generated_at
    )
    VALUES (
        gen_random_uuid(),
        :studentId,
        :institutionId,
        :periodStart,
        :periodEnd,
        :thresholdPercent,
        :attendancePercent,
        'OPEN',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (
        student_id,
        period_start,
        period_end,
        threshold_percent
    ) DO NOTHING
    """, nativeQuery = true)
    int insertIfAbsent(
            @Param("studentId") UUID studentId,
            @Param("institutionId") UUID institutionId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd,
            @Param("thresholdPercent") BigDecimal thresholdPercent,
            @Param("attendancePercent") BigDecimal attendancePercent);

    Optional<AttendanceAlert> findByStudent_IdAndPeriodStartAndPeriodEndAndThresholdPercent(
            UUID studentId,
            LocalDate periodStart,
            LocalDate periodEnd,
            BigDecimal thresholdPercent
    );


    @Query("""
    SELECT a
    FROM AttendanceAlert a
    WHERE a.institution.id = :institutionId
      AND (:status IS NULL OR a.status = :status)
      AND a.periodStart >= :startDate
      AND a.periodEnd <= :endDate
    ORDER BY a.generatedAt DESC
    """)
    Page<AttendanceAlert> searchAlerts(
            @Param("institutionId") UUID institutionId,
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

}