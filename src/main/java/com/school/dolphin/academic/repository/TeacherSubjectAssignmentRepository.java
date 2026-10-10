package com.school.dolphin.academic.repository;

import com.school.dolphin.academic.entity.TeacherSubjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherSubjectAssignmentRepository
        extends JpaRepository<TeacherSubjectAssignment, UUID> {

    List<TeacherSubjectAssignment>
    findByStaffAssignment_Institution_IdAndActiveTrueOrderByStartDateDesc(
            UUID institutionId);

    boolean existsByStaffAssignment_IdAndSubject_IdAndActiveTrue(
            UUID staffAssignmentId, UUID subjectId);
}