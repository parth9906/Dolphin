package com.school.dolphin.student.service;

import com.school.dolphin.student.dto.StudentResponse;
import com.school.dolphin.student.entity.Student;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentPortalService {

    private final CurrentStudentResolver currentStudentResolver;

    @Transactional(readOnly = true)
    public StudentResponse getMyProfile(Authentication authentication) {
        Student student = currentStudentResolver.requireStudent(authentication);

        if (!student.isActive()) {
            throw new AccessDeniedException(
                    "Inactive students cannot access the student portal");
        }

        return StudentResponse.from(student);
    }
}
