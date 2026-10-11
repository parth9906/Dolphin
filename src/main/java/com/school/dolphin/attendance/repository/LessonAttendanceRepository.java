package com.school.dolphin.attendance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.school.dolphin.attendance.dto.AttendanceGroupAggregate;
import com.school.dolphin.attendance.dto.StudentAttendanceAggregate;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.school.dolphin.attendance.entity.LessonAttendanceRecord;

public interface LessonAttendanceRepository
        extends JpaRepository<LessonAttendanceRecord, UUID> {

    boolean existsByLessonOccurrence_IdAndStudent_Id(
            UUID occurrenceId,
            UUID studentId);

    List<LessonAttendanceRecord>
    findByLessonOccurrence_IdOrderByStudent_LastNameAscStudent_FirstNameAsc(
            UUID occurrenceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select a
          from LessonAttendanceRecord a
          join fetch a.lessonOccurrence occurrence
          join fetch a.student student
         where a.id = :recordId
        """)
    Optional<LessonAttendanceRecord> findByIdForUpdate(
            @Param("recordId") UUID recordId);

    @Query("""
        select a
          from LessonAttendanceRecord a
          join fetch a.lessonOccurrence occurrence
          join fetch a.student student
         where occurrence.id = :occurrenceId
         order by student.lastName asc, student.firstName asc
        """)
    List<LessonAttendanceRecord> findRecordsWithStudent(
            @Param("occurrenceId") UUID occurrenceId);

    @Query("""
    select new com.school.dolphin.attendance.dto.StudentAttendanceAggregate(
        student.id,
        concat(student.firstName, ' ', student.lastName),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.ABSENT
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.EXCUSED
            then a.id
        end)
    )
    from LessonAttendanceRecord a
    join a.student student
    join a.lessonOccurrence occurrence
    join occurrence.scheduledLesson lesson
    where lesson.section.id = :sectionId
        and lesson.section.schoolClass.academicYear.institution.id = :institutionId
        and occurrence.lessonDate between :startDate and :endDate
    group by student.id, student.firstName, student.lastName
    order by student.lastName, student.firstName
    """)
    List<StudentAttendanceAggregate> findStudentAttendanceAnalytics(
            @Param("institutionId") UUID institutionId,
            @Param("sectionId") UUID sectionId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("""
    select new com.school.dolphin.attendance.dto.AttendanceGroupAggregate(
        section.id,
        concat(schoolClass.name, ' - ', section.name),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.ABSENT
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.EXCUSED
            then a.id
        end)
    )
    from LessonAttendanceRecord a
    join a.lessonOccurrence occurrence
    join occurrence.scheduledLesson lesson
    join lesson.section section
    join section.schoolClass schoolClass
    join schoolClass.academicYear academicYear
    where academicYear.institution.id = :institutionId
      and occurrence.lessonDate between :startDate and :endDate
    group by section.id, schoolClass.name, section.name
    order by schoolClass.name, section.name
    """)
    List<AttendanceGroupAggregate> findSectionAttendanceAnalytics(
            @Param("institutionId") UUID institutionId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("""
    select new com.school.dolphin.attendance.dto.AttendanceGroupAggregate(
        subject.id,
        subject.name,
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.PRESENT
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.LATE
              or a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.ABSENT
            then a.id
        end),
        count(case
            when a.status = com.school.dolphin.attendance.entity.LessonAttendanceStatus.EXCUSED
            then a.id
        end)
    )
    from LessonAttendanceRecord a
    join a.lessonOccurrence occurrence
    join occurrence.scheduledLesson lesson
    join lesson.subject subject
    join lesson.section section
    join section.schoolClass schoolClass
    join schoolClass.academicYear academicYear
    where academicYear.institution.id = :institutionId
      and occurrence.lessonDate between :startDate and :endDate
    group by subject.id, subject.name
    order by subject.name
    """)
    List<AttendanceGroupAggregate> findSubjectAttendanceAnalytics(
            @Param("institutionId") UUID institutionId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("""
    select a
      from LessonAttendanceRecord a
      join fetch a.lessonOccurrence occurrence
      join fetch occurrence.scheduledLesson lesson
      join fetch lesson.slot slot
      join fetch lesson.subject subject
     where a.student.id = :studentId
       and occurrence.lessonDate between :startDate and :endDate
     order by occurrence.lessonDate desc, slot.startTime desc
    """)
    List<LessonAttendanceRecord> findParentLessonAttendance(
            @Param("studentId") UUID studentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}