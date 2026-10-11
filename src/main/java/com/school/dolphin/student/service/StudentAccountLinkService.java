package com.school.dolphin.student.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.guardian.repository.GuardianRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.repository.UserAccountRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.staff.repository.StaffMemberRepository;
import com.school.dolphin.student.dto.LinkStudentAccountRequest;
import com.school.dolphin.student.dto.StudentAccountLinkResponse;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.entity.StudentAccountLink;
import com.school.dolphin.student.repository.StudentAccountLinkRepository;
import com.school.dolphin.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentAccountLinkService {

    private final StudentRepository studentRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentAccountLinkRepository studentAccountLinkRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional
    public StudentAccountLinkResponse link(
            UUID studentId,
            LinkStudentAccountRequest request,
            Authentication authentication
    ) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!student.isActive()) {
            throw new BusinessRuleViolationException(
                    "An inactive student cannot be linked to an account");
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication, student.getInstitution().getId())) {
            throw new AccessDeniedException(
                    "You do not have access to this student's institution");
        }

        UserAccount userAccount = userAccountRepository
                .findById(request.userAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (!userAccount.isActive()) {
            throw new BusinessRuleViolationException(
                    "An inactive user account cannot be linked to a student");
        }

        if (studentAccountLinkRepository.existsByStudent_Id(student.getId())) {
            throw new DuplicateResourceException(
                    "This student already has a linked user account");
        }

        if (studentAccountLinkRepository.existsByUserAccount_Id(userAccount.getId())) {
            throw new DuplicateResourceException(
                    "This user account is already linked to a student");
        }

        if (staffMemberRepository.existsByUserAccount_Id(userAccount.getId())
                || guardianRepository.existsByUserAccount_Id(userAccount.getId())) {
            throw new BusinessRuleViolationException(
                    "A staff or guardian account cannot also be linked to a student");
        }

        StudentAccountLink link = new StudentAccountLink();
        link.setStudent(student);
        link.setUserAccount(userAccount);

        return StudentAccountLinkResponse.from(
                studentAccountLinkRepository.save(link));
    }
}
