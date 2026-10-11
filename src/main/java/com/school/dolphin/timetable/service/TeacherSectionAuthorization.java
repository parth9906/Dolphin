package com.school.dolphin.timetable.service;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffMember;
import com.school.dolphin.staff.entity.StaffType;
import com.school.dolphin.staff.repository.StaffMemberRepository;
import com.school.dolphin.timetable.repository.ScheduledLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Single definition of the policy "this teacher is currently assigned to teach
 * this section". Section-scoped authorization for teachers is derived from the
 * timetable: a teacher may act on a section only while one of their active
 * teaching assignments covers it on the relevant date.
 */
@Component
@RequiredArgsConstructor
public class TeacherSectionAuthorization {

    private final AuthenticatedUserResolver authenticatedUserResolver;
    private final StaffMemberRepository staffMemberRepository;
    private final ScheduledLessonRepository scheduledLessonRepository;

    @Transactional(readOnly = true)
    public Optional<StaffMember> findCurrentActiveStaffMember(
            Authentication authentication
    ) {
        UserAccount user = authenticatedUserResolver
                .requireUserAccount(authentication);

        return staffMemberRepository
                .findByUserAccount_Id(user.getId())
                .filter(StaffMember::isActive);
    }

    @Transactional(readOnly = true)
    public boolean isTeachingSection(
            UUID staffMemberId,
            UUID sectionId,
            UUID institutionId,
            LocalDate onDate
    ) {
        return scheduledLessonRepository
                .existsActiveTeachingAssignmentForSection(
                        sectionId,
                        staffMemberId,
                        institutionId,
                        StaffAssignmentStatus.ACTIVE,
                        StaffType.TEACHER,
                        onDate
                );
    }

    @Transactional(readOnly = true)
    public boolean isCurrentUserTeachingSection(
            Authentication authentication,
            UUID sectionId,
            UUID institutionId,
            LocalDate onDate
    ) {
        return findCurrentActiveStaffMember(authentication)
                .map(staff -> isTeachingSection(
                        staff.getId(), sectionId, institutionId, onDate))
                .orElse(false);
    }
}
