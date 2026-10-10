
package com.school.dolphin.parent.controller;

import com.school.dolphin.parent.dto.ParentAttendanceResponse;
import com.school.dolphin.parent.dto.ParentPortalStudentResponse;
import com.school.dolphin.parent.service.ParentPortalService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/parent-portal")
@PreAuthorize("hasAuthority('PARENT_PORTAL_READ')")
public class ParentPortalController {

    private final ParentPortalService parentPortalService;

    public ParentPortalController(
            ParentPortalService parentPortalService
    ) {
        this.parentPortalService = parentPortalService;
    }

    @GetMapping("/students")
    public List<ParentPortalStudentResponse> getLinkedStudents(
            Authentication authentication
    ) {
        return parentPortalService.getLinkedStudents(authentication);
    }

    @GetMapping("/students/{studentId}")
    public ParentPortalStudentResponse getLinkedStudent(
            @PathVariable UUID studentId,
            Authentication authentication
    ) {
        return parentPortalService.getLinkedStudent(
                studentId, authentication
        );
    }


    @GetMapping("/students/{studentId}/attendance")
    public List<ParentAttendanceResponse> getStudentAttendance(
            @PathVariable UUID studentId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            Authentication authentication) {

        return parentPortalService.getStudentAttendance(
                studentId, from, to, authentication
        );
    }
}