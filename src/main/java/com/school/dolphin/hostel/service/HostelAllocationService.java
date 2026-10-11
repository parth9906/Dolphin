package com.school.dolphin.hostel.service;

import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.common.exception.StaleResourceVersionException;
import com.school.dolphin.hostel.dto.CreateHostelAllocationRequest;
import com.school.dolphin.hostel.dto.HostelAllocationResponse;
import com.school.dolphin.hostel.dto.VacateHostelAllocationRequest;
import com.school.dolphin.hostel.entity.Hostel;
import com.school.dolphin.hostel.entity.HostelAllocation;
import com.school.dolphin.hostel.entity.HostelAllocationStatus;
import com.school.dolphin.hostel.entity.HostelRoom;
import com.school.dolphin.hostel.repository.HostelAllocationRepository;
import com.school.dolphin.hostel.repository.HostelRepository;
import com.school.dolphin.hostel.repository.HostelRoomRepository;
import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.identity.security.AuthenticatedUserResolver;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HostelAllocationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final HostelAllocationRepository hostelAllocationRepository;
    private final HostelRoomRepository hostelRoomRepository;
    private final HostelRepository hostelRepository;
    private final StudentRepository studentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Transactional
    public HostelAllocationResponse create(
            UUID hostelId,
            CreateHostelAllocationRequest request,
            Authentication authentication
    ) {
        Hostel hostel = requireActiveHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        Student student = studentRepository
                .findByIdAndActiveTrue(request.studentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        if (!student.getInstitution().getId()
                .equals(hostel.getInstitution().getId())) {
            throw new BusinessRuleViolationException(
                    "Student does not belong to the hostel institution");
        }

        requireValidDates(request.startDate(), request.endDate());

        if (hostelAllocationRepository
                .findFirstByStudent_IdAndStatus(
                        student.getId(), HostelAllocationStatus.ACTIVE)
                .isPresent()) {
            throw new DuplicateResourceException(
                    "Student already has an active hostel allocation");
        }

        // Pessimistic lock serializes concurrent allocations for this room so
        // the capacity check below cannot be raced.
        HostelRoom room = hostelRoomRepository
                .findByIdForUpdate(request.roomId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Hostel room not found"));

        if (!room.getHostel().getId().equals(hostelId)) {
            throw new BusinessRuleViolationException(
                    "Hostel room does not belong to the requested hostel");
        }

        if (!room.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot allocate a student to an inactive room");
        }

        long occupied = hostelAllocationRepository
                .countByRoom_IdAndStatus(
                        room.getId(), HostelAllocationStatus.ACTIVE);

        if (occupied >= room.getCapacity()) {
            throw new BusinessRuleViolationException(
                    "Hostel room is already at full capacity");
        }

        UserAccount allocator =
                authenticatedUserResolver.requireUserAccount(authentication);

        HostelAllocation allocation = HostelAllocation.builder()
                .student(student)
                .room(room)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(HostelAllocationStatus.ACTIVE)
                .notes(normalize(request.notes()))
                .allocatedBy(allocator)
                .build();

        return HostelAllocationResponse.from(
                hostelAllocationRepository.save(allocation));
    }

    @Transactional
    public HostelAllocationResponse vacate(
            UUID hostelId,
            UUID allocationId,
            VacateHostelAllocationRequest request,
            Authentication authentication
    ) {
        HostelAllocation allocation = requireAllocation(
                hostelId, allocationId);

        requireInstitutionAccess(
                authentication,
                allocation.getRoom().getHostel().getInstitution().getId());

        if (allocation.getStatus() != HostelAllocationStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "Only an active allocation can be vacated");
        }

        ensureVersion(allocation, request.version());

        LocalDate endDate = request.endDate() == null
                ? LocalDate.now()
                : request.endDate();

        requireValidDates(allocation.getStartDate(), endDate);

        allocation.setEndDate(endDate);
        allocation.setStatus(HostelAllocationStatus.VACATED);

        return HostelAllocationResponse.from(
                hostelAllocationRepository.save(allocation));
    }

    @Transactional(readOnly = true)
    public HostelAllocationResponse getById(
            UUID hostelId,
            UUID allocationId,
            Authentication authentication
    ) {
        HostelAllocation allocation = requireAllocation(
                hostelId, allocationId);

        requireInstitutionAccess(
                authentication,
                allocation.getRoom().getHostel().getInstitution().getId());

        return HostelAllocationResponse.from(allocation);
    }

    @Transactional(readOnly = true)
    public Page<HostelAllocationResponse> search(
            UUID hostelId,
            UUID roomId,
            UUID studentId,
            HostelAllocationStatus status,
            Pageable pageable,
            Authentication authentication
    ) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new BusinessRuleViolationException(
                    "Page size cannot exceed " + MAX_PAGE_SIZE);
        }

        Hostel hostel = requireHostel(hostelId);

        requireInstitutionAccess(
                authentication, hostel.getInstitution().getId());

        if (roomId != null) {
            hostelRoomRepository
                    .findByIdAndHostel_Id(roomId, hostelId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Hostel room not found"));
        }

        return hostelAllocationRepository
                .search(hostelId, roomId, studentId, status, pageable)
                .map(HostelAllocationResponse::from);
    }

    private void requireValidDates(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessRuleViolationException(
                    "Allocation end date cannot be before its start date");
        }
    }

    private HostelAllocation requireAllocation(
            UUID hostelId,
            UUID allocationId
    ) {
        return hostelAllocationRepository
                .findByIdAndRoom_Hostel_Id(allocationId, hostelId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Hostel allocation not found"));
    }

    private Hostel requireHostel(UUID hostelId) {
        return hostelRepository.findById(hostelId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hostel not found"));
    }

    private Hostel requireActiveHostel(UUID hostelId) {
        Hostel hostel = requireHostel(hostelId);

        if (!hostel.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot allocate students in an inactive hostel");
        }

        return hostel;
    }

    private void ensureVersion(
            HostelAllocation allocation,
            Long version
    ) {
        if (version == null || !version.equals(allocation.getVersion())) {
            throw new StaleResourceVersionException(
                    "The hostel allocation was modified by another request. "
                            + "Reload it and try again.");
        }
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution.");
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
