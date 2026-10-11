package com.school.dolphin.student.controller;

import com.school.dolphin.student.dto.StudentResponse;
import com.school.dolphin.student.service.StudentPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student-portal")
@RequiredArgsConstructor
public class StudentPortalController {

    private final StudentPortalService studentPortalService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('STUDENT_PORTAL_READ')")
    public StudentResponse getMyProfile(Authentication authentication) {
        return studentPortalService.getMyProfile(authentication);
    }
}
