package com.school.dolphin.timetable.repository;

import com.school.dolphin.timetable.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface TimetableSlotRepository
        extends JpaRepository<TimetableSlot, UUID> {

    List<TimetableSlot>
    findByAcademicYear_IdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(
            UUID academicYearId);

    boolean existsByAcademicYear_IdAndDayOfWeekAndStartTimeAndEndTime(
            UUID academicYearId,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime);
}
