package com.school.dolphin.timetable.controller;

import com.school.dolphin.timetable.dto.ScheduledLessonResponse;
import com.school.dolphin.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Self-scoped student timetable. The student's active enrollments determine the
 * sections returned; the client cannot request another student's schedule.
 */
@RestController
@RequestMapping("/api/v1/student-portal")
@RequiredArgsConstructor
public class StudentPortalTimetableController {

    private final TimetableService timetableService;

    @GetMapping("/timetable")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public List<ScheduledLessonResponse> getMyTimetable(
            Authentication authentication
    ) {
        return timetableService.getMyTimetable(authentication);
    }
}
