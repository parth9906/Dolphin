
package com.school.dolphin.attendance.repository;

import com.school.dolphin.attendance.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceRepository
        extends JpaRepository<AttendanceRecord, UUID> {

    List<AttendanceRecord>
    findByStudent_IdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            UUID studentId,
            LocalDate from,
            LocalDate to
    );


    boolean existsByStudent_IdAndAttendanceDate(
            UUID studentId,
            LocalDate attendanceDate
    );


    @Query(
            value = """
        SELECT a
        FROM AttendanceRecord a
        JOIN FETCH a.student s
        WHERE s.institution.id = :institutionId
          AND a.attendanceDate = :attendanceDate
          AND (:studentId IS NULL OR s.id = :studentId)
        ORDER BY s.firstName ASC, s.lastName ASC
        """,
            countQuery = """
        SELECT COUNT(a)
        FROM AttendanceRecord a
        WHERE a.student.institution.id = :institutionId
          AND a.attendanceDate = :attendanceDate
          AND (:studentId IS NULL OR a.student.id = :studentId)
        """
    )
    Page<AttendanceRecord> findInstitutionAttendance(
            @Param("institutionId") UUID institutionId,
            @Param("attendanceDate") LocalDate attendanceDate,
            @Param("studentId") UUID studentId,
            Pageable pageable
    );

    @Query("""
    SELECT a.status, COUNT(a.id)
    FROM AttendanceRecord a
    JOIN a.student s
    WHERE s.institution.id = :institutionId
      AND a.attendanceDate = :attendanceDate
      AND (:campusId IS NULL OR s.campus.id = :campusId)
    GROUP BY a.status
    """)
    List<Object[]> countStatusesForDate(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("attendanceDate") LocalDate attendanceDate
    );

    @Query("""
    SELECT a.attendanceDate, a.status, COUNT(a.id)
    FROM AttendanceRecord a
    JOIN a.student s
    WHERE s.institution.id = :institutionId
      AND a.attendanceDate BETWEEN :from AND :to
      AND (:campusId IS NULL OR s.campus.id = :campusId)
    GROUP BY a.attendanceDate, a.status
    ORDER BY a.attendanceDate ASC
    """)
    List<Object[]> countStatusesByDateRange(
            @Param("institutionId") UUID institutionId,
            @Param("campusId") UUID campusId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}