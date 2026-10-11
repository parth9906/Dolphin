package com.school.dolphin.timetable.service;


import com.school.dolphin.academic.entity.AcademicSubject;
import com.school.dolphin.academic.entity.AcademicYear;
import com.school.dolphin.academic.entity.AcademicYearStatus;
import com.school.dolphin.academic.entity.ClassSection;
import com.school.dolphin.academic.repository.AcademicSubjectRepository;
import com.school.dolphin.academic.repository.AcademicYearRepository;
import com.school.dolphin.academic.repository.ClassSectionRepository;
import com.school.dolphin.academic.repository.TeacherSubjectAssignmentRepository;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.organization.entity.Campus;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.organization.repository.CampusRepository;
import com.school.dolphin.organization.repository.InstitutionRepository;
import com.school.dolphin.staff.entity.StaffAssignment;
import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import com.school.dolphin.staff.entity.StaffMember;
import com.school.dolphin.staff.entity.StaffType;
import com.school.dolphin.staff.repository.StaffAssignmentRepository;
import com.school.dolphin.timetable.dto.*;
import com.school.dolphin.timetable.entity.ScheduledLesson;
import com.school.dolphin.timetable.entity.SchoolRoom;
import com.school.dolphin.timetable.entity.TimetableSlot;
import com.school.dolphin.timetable.repository.ScheduledLessonRepository;
import com.school.dolphin.timetable.repository.SchoolRoomRepository;
import com.school.dolphin.timetable.repository.TimetableSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableSlotRepository slotRepository;
    private final ScheduledLessonRepository lessonRepository;
    private final SchoolRoomRepository roomRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ClassSectionRepository sectionRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final AcademicSubjectRepository subjectRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final InstitutionRepository institutionRepository;
    private final CampusRepository campusRepository;

    @Transactional
    public UUID createSlot(
            CreateTimetableSlotRequest request,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository
                .findById(request.academicYearId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        requireInstitutionAccess(authentication, year.getInstitution().getId());

        if (year.getStatus() == AcademicYearStatus.CLOSED) {
            throw new BusinessRuleViolationException(
                    "Cannot add slots to a closed academic year");
        }

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BusinessRuleViolationException(
                    "Slot end time must be after start time");
        }

        List<TimetableSlot> existing = slotRepository
                .findByAcademicYear_IdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(
                        year.getId());

        boolean overlaps = existing.stream()
                .filter(slot -> slot.getDayOfWeek() == request.dayOfWeek())
                .anyMatch(slot ->
                        request.startTime().isBefore(slot.getEndTime())
                                && slot.getStartTime().isBefore(request.endTime()));

        if (overlaps) {
            throw new BusinessRuleViolationException(
                    "This time overlaps an existing slot on that weekday");
        }

        TimetableSlot slot = new TimetableSlot();
        slot.setAcademicYear(year);
        slot.setDayOfWeek(request.dayOfWeek());
        slot.setStartTime(request.startTime());
        slot.setEndTime(request.endTime());
        slot.setLabel(request.label());

        return slotRepository.save(slot).getId();
    }

    @Transactional
    public UUID createLesson(
            CreateScheduledLessonRequest request,
            Authentication authentication
    ) {
        ClassSection section = sectionRepository.findById(request.sectionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Section not found"));

        TimetableSlot slot = slotRepository.findById(request.slotId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Timetable slot not found"));

        StaffAssignment teacher = staffAssignmentRepository
                .findById(request.teacherAssignmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Teacher assignment not found"));

        AcademicSubject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject not found"));

        AcademicYear year = section.getSchoolClass().getAcademicYear();
        UUID institutionId = year.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (year.getStatus() == AcademicYearStatus.CLOSED
                || !section.isActive()
                || !section.getSchoolClass().isActive()
                || !slot.isActive()
                || !slot.getAcademicYear().getId().equals(year.getId())) {
            throw new BusinessRuleViolationException(
                    "Section and slot must be active and belong to the same academic year");
        }

        if (!teacher.getInstitution().getId().equals(institutionId)
                || !subject.getInstitution().getId().equals(institutionId)) {
            throw new BusinessRuleViolationException(
                    "Teacher and subject must belong to the section's institution");
        }

        if (teacher.getStatus() != StaffAssignmentStatus.ACTIVE
                || teacher.getStaffType() != StaffType.TEACHER) {
            throw new BusinessRuleViolationException(
                    "The assigned staff member must be an active teacher");
        }

        boolean assignedToSubject =
                teacherSubjectAssignmentRepository
                        .existsByStaffAssignment_IdAndSubject_IdAndActiveTrue(
                                teacher.getId(), subject.getId());

        if (!assignedToSubject) {
            throw new BusinessRuleViolationException(
                    "This teacher is not assigned to teach the selected subject");
        }

        if (lessonRepository.existsBySection_IdAndSlot_IdAndActiveTrue(
                section.getId(), slot.getId())) {
            throw new DuplicateResourceException(
                    "The section already has a lesson in this slot");
        }

        if (lessonRepository.existsByTeacherAssignment_IdAndSlot_IdAndActiveTrue(
                teacher.getId(), slot.getId())) {
            throw new DuplicateResourceException(
                    "The teacher already has a lesson in this slot");
        }

        SchoolRoom room = null;
        if (request.roomId() != null) {
            room = roomRepository.findById(request.roomId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Room not found"));

            if (!room.isActive()
                    || !room.getInstitution().getId().equals(institutionId)) {
                throw new BusinessRuleViolationException(
                        "Room must be active and belong to the same institution");
            }

            UUID sectionCampusId = section.getCampus() == null
                    ? null : section.getCampus().getId();

            UUID roomCampusId = room.getCampus() == null
                    ? null : room.getCampus().getId();

            if (roomCampusId != null
                    && !roomCampusId.equals(sectionCampusId)) {
                throw new BusinessRuleViolationException(
                        "Room is not available for this section's campus");
            }

            if (lessonRepository.existsByRoom_IdAndSlot_IdAndActiveTrue(
                    room.getId(), slot.getId())) {
                throw new DuplicateResourceException(
                        "The room is already booked in this slot");
            }
        }

        ScheduledLesson lesson = new ScheduledLesson();
        lesson.setSection(section);
        lesson.setSlot(slot);
        lesson.setTeacherAssignment(teacher);
        lesson.setSubject(subject);
        lesson.setRoom(room);

        return lessonRepository.save(lesson).getId();
    }


    @Transactional
    public UUID createRoom(
            CreateSchoolRoomRequest request,
            Authentication authentication
    ) {
        Institution institution = institutionRepository
                .findById(request.institutionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Institution not found"));

        requireInstitutionAccess(authentication, institution.getId());

        if (!institution.isActive()) {
            throw new BusinessRuleViolationException(
                    "Cannot add a room to an inactive institution");
        }

        if (roomRepository.existsByInstitution_IdAndCodeIgnoreCase(
                institution.getId(), request.code().trim())) {
            throw new DuplicateResourceException(
                    "Room code already exists in this institution");
        }

        Campus campus = null;
        if (request.campusId() != null) {
            campus = campusRepository.findById(request.campusId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Campus not found"));

            if (!campus.isActive()
                    || !campus.getInstitution().getId().equals(institution.getId())) {
                throw new BusinessRuleViolationException(
                        "Campus must be active and belong to this institution");
            }
        }

        SchoolRoom room = new SchoolRoom();
        room.setInstitution(institution);
        room.setCampus(campus);
        room.setCode(request.code().trim());
        room.setName(request.name().trim());
        room.setCapacity(request.capacity());

        return roomRepository.save(room).getId();
    }

    @Transactional(readOnly = true)
    public List<SchoolRoomResponse> getRooms(
            UUID institutionId,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return roomRepository
                .findByInstitution_IdAndActiveTrueOrderByNameAsc(institutionId)
                .stream()
                .map(room -> new SchoolRoomResponse(
                        room.getId(),
                        room.getInstitution().getId(),
                        room.getCampus() == null ? null : room.getCampus().getId(),
                        room.getCode(),
                        room.getName(),
                        room.getCapacity(),
                        room.isActive()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TimetableSlotResponse> getSlots(
            UUID academicYearId,
            Authentication authentication
    ) {
        AcademicYear year = academicYearRepository.findById(academicYearId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Academic year not found"));

        requireInstitutionAccess(authentication, year.getInstitution().getId());

        return slotRepository
                .findByAcademicYear_IdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(
                        academicYearId)
                .stream()
                .map(timeTableSlot -> new TimetableSlotResponse(
                            timeTableSlot.getId(),
                            timeTableSlot.getAcademicYear().getId(),
                            timeTableSlot.getDayOfWeek(),
                            timeTableSlot.getStartTime(),
                            timeTableSlot.getEndTime(),
                            timeTableSlot.getLabel(),
                            timeTableSlot.isActive()
                    ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduledLessonResponse> getSectionTimetable(
            UUID sectionId,
            Authentication authentication
    ) {
        ClassSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Section not found"));

        requireInstitutionAccess(
                authentication,
                section.getSchoolClass().getAcademicYear()
                        .getInstitution().getId());

        return lessonRepository.findBySection_IdAndActiveTrue(sectionId)
                .stream()
                .sorted(Comparator
                        .comparingInt((ScheduledLesson l) ->
                                l.getSlot().getDayOfWeek())
                        .thenComparing(l -> l.getSlot().getStartTime()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduledLessonResponse> getTeacherTimetable(
            UUID staffAssignmentId,
            Authentication authentication
    ) {
        StaffAssignment teacher = staffAssignmentRepository
                .findById(staffAssignmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Staff assignment not found"));

        requireInstitutionAccess(
                authentication, teacher.getInstitution().getId());

        if (teacher.getStaffType() != StaffType.TEACHER) {
            throw new BusinessRuleViolationException(
                    "The requested staff assignment is not a teacher");
        }

        return lessonRepository
                .findByTeacherAssignment_IdAndActiveTrue(staffAssignmentId)
                .stream()
                .sorted(Comparator
                        .comparingInt((ScheduledLesson l) ->
                                l.getSlot().getDayOfWeek())
                        .thenComparing(l -> l.getSlot().getStartTime()))
                .map(this::toResponse)
                .toList();
    }


    @Transactional
    public UUID cancelLesson(
            UUID lessonId,
            Authentication authentication
    ) {
        ScheduledLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Scheduled lesson not found"));

        UUID institutionId = lesson.getSection()
                .getSchoolClass().getAcademicYear()
                .getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!lesson.isActive()) {
            throw new BusinessRuleViolationException(
                    "Lesson has already been cancelled");
        }

        lesson.setActive(false);
        return lessonRepository.save(lesson).getId();
    }


    @Transactional
    public UUID rescheduleLesson(
            UUID lessonId,
            RescheduleLessonRequest request,
            Authentication authentication
    ) {
        ScheduledLesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Scheduled lesson not found"));

        if (!lesson.isActive()) {
            throw new BusinessRuleViolationException(
                    "A cancelled lesson cannot be rescheduled");
        }

        ClassSection section = lesson.getSection();
        UUID institutionId = section.getSchoolClass()
                .getAcademicYear().getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        TimetableSlot slot = slotRepository.findById(request.slotId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Timetable slot not found"));

        StaffAssignment teacher = staffAssignmentRepository
                .findById(request.teacherAssignmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Teacher assignment not found"));

        AcademicSubject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject not found"));

        AcademicYear year = section.getSchoolClass().getAcademicYear();

        if (!slot.isActive()
                || !slot.getAcademicYear().getId().equals(year.getId())
                || year.getStatus() == AcademicYearStatus.CLOSED
                || !section.isActive()
                || !section.getSchoolClass().isActive()) {
            throw new BusinessRuleViolationException(
                    "The new slot and section must be active and in the same academic year");
        }

        if (!teacher.getInstitution().getId().equals(institutionId)
                || !subject.getInstitution().getId().equals(institutionId)
                || teacher.getStatus() != StaffAssignmentStatus.ACTIVE
                || teacher.getStaffType() != StaffType.TEACHER) {
            throw new BusinessRuleViolationException(
                    "The selected teacher and subject must be valid for this institution");
        }

        boolean subjectAssigned = teacherSubjectAssignmentRepository
                .existsByStaffAssignment_IdAndSubject_IdAndActiveTrue(
                        teacher.getId(), subject.getId());

        if (!subjectAssigned) {
            throw new BusinessRuleViolationException(
                    "The teacher is not assigned to this subject");
        }

        if (lessonRepository.existsBySection_IdAndSlot_IdAndIdNotAndActiveTrue(
                section.getId(), slot.getId(), lessonId)) {
            throw new DuplicateResourceException(
                    "The section already has a lesson in this slot");
        }

        if (lessonRepository
                .existsByTeacherAssignment_IdAndSlot_IdAndIdNotAndActiveTrue(
                        teacher.getId(), slot.getId(), lessonId)) {
            throw new DuplicateResourceException(
                    "The teacher already has a lesson in this slot");
        }

        SchoolRoom room = null;

        if (request.roomId() != null) {
            room = roomRepository.findById(request.roomId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Room not found"));

            if (!room.isActive()
                    || !room.getInstitution().getId().equals(institutionId)) {
                throw new BusinessRuleViolationException(
                        "Room must be active and belong to this institution");
            }

            UUID sectionCampusId = section.getCampus() == null
                    ? null : section.getCampus().getId();
            UUID roomCampusId = room.getCampus() == null
                    ? null : room.getCampus().getId();

            if (roomCampusId != null
                    && !roomCampusId.equals(sectionCampusId)) {
                throw new BusinessRuleViolationException(
                        "Room is not available for this section's campus");
            }

            if (lessonRepository.existsByRoom_IdAndSlot_IdAndIdNotAndActiveTrue(
                    room.getId(), slot.getId(), lessonId)) {
                throw new DuplicateResourceException(
                        "The room is already booked in this slot");
            }
        }

        lesson.setSlot(slot);
        lesson.setTeacherAssignment(teacher);
        lesson.setSubject(subject);
        lesson.setRoom(room);

        return lessonRepository.save(lesson).getId();
    }

    private ScheduledLessonResponse toResponse(ScheduledLesson lesson) {
        StaffAssignment assignment = lesson.getTeacherAssignment();
        StaffMember staff = assignment.getStaffMember();
        TimetableSlot slot = lesson.getSlot();
        ClassSection section = lesson.getSection();

        return new ScheduledLessonResponse(
                lesson.getId(),
                section.getId(),
                section.getName(),
                slot.getId(),
                slot.getDayOfWeek(),
                slot.getStartTime(),
                slot.getEndTime(),
                assignment.getId(),
                staff.getFirstName() + " " + staff.getLastName(),
                lesson.getSubject().getId(),
                lesson.getSubject().getName(),
                lesson.getRoom() == null ? null : lesson.getRoom().getId(),
                lesson.getRoom() == null ? null : lesson.getRoom().getName()
        );
    }

    private void requireInstitutionAccess(
            Authentication authentication,
            UUID institutionId
    ) {
        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            throw new AccessDeniedException(
                    "You do not have access to this institution");
        }
    }
}
