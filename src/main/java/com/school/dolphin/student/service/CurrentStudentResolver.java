package com.school.dolphin.student.service;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentAccountLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentStudentResolver {

    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final StudentAccountLinkRepository studentAccountLinkRepository;

    public Student requireStudent(Authentication authentication) {
        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        return studentAccountLinkRepository
                .findByUserAccount_Id(user.getId())
                .map(link -> link.getStudent())
                .orElseThrow(() -> new AccessDeniedException(
                        "No student profile is linked to this account"));
    }
}
