package com.school.dolphin.leave.service;

import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.leave.dto.LeaveTypeResponse;
import com.school.dolphin.leave.entity.LeaveType;
import com.school.dolphin.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getStaffLeaveTypes(
            UUID institutionId,
            Authentication authentication
    ) {
        return getActiveLeaveTypes(institutionId, authentication);
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getStudentLeaveTypes(
            UUID institutionId,
            Authentication authentication
    ) {
        return getActiveLeaveTypes(institutionId, authentication);
    }

    private List<LeaveTypeResponse> getActiveLeaveTypes(
            UUID institutionId,
            Authentication authentication
    ) {
        if (institutionId == null) {
            throw new IllegalArgumentException(
                    "Institution ID is required"
            );
        }

        if (!scopeAuthorization.canAccessInstitution(
                authentication,
                institutionId
        )) {
            throw new AccessDeniedException(
                    "You do not have access to this institution"
            );
        }

        return leaveTypeRepository
                .findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LeaveTypeResponse toResponse(LeaveType leaveType) {
        return new LeaveTypeResponse(
                leaveType.getId(),
                leaveType.getCode(),
                leaveType.getName()
        );
    }
}