package com.school.dolphin.assessment.service;

import com.school.dolphin.assessment.dto.AssessmentResultItem;
import com.school.dolphin.assessment.dto.StudentReportCardResponse;
import com.school.dolphin.assessment.dto.SubjectResultResponse;
import com.school.dolphin.assessment.entity.StudentMark;
import com.school.dolphin.assessment.repository.StudentMarkRepository;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import com.school.dolphin.student.service.StudentSectionResolver;
import com.school.dolphin.timetable.service.TeacherSectionAuthorization;
import com.school.dolphin.student.service.CurrentStudentResolver;
import com.school.dolphin.common.exception.ResourceNotFoundException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class StudentReportCardService {

    private static final int MAX_REPORT_RANGE_DAYS = 366;

    private final StudentMarkRepository studentMarkRepository;
    private final StudentRepository studentRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final GradeCalculator gradeCalculator;
    private final CurrentStudentResolver currentStudentResolver;
    private final TeacherSectionAuthorization teacherSectionAuthorization;
    private final StudentSectionResolver studentSectionResolver;

    public StudentReportCardService(
            StudentMarkRepository studentMarkRepository,
            StudentRepository studentRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            GradeCalculator gradeCalculator,
            CurrentStudentResolver currentStudentResolver,
            TeacherSectionAuthorization teacherSectionAuthorization,
            StudentSectionResolver studentSectionResolver
    ) {
        this.studentMarkRepository = studentMarkRepository;
        this.studentRepository = studentRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.gradeCalculator = gradeCalculator;
        this.currentStudentResolver = currentStudentResolver;
        this.teacherSectionAuthorization = teacherSectionAuthorization;
        this.studentSectionResolver = studentSectionResolver;
    }

    @Transactional(readOnly = true)
    public StudentReportCardResponse getReportCard(
            UUID studentId,
            LocalDate fromDate,
            LocalDate toDate,
            Authentication authentication
    ) {
        validateDateRange(fromDate, toDate);

        Student student = studentRepository
                .findByIdAndActiveTrue(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Active student not found")
                );

        UUID institutionId = student.getInstitution().getId();

        if (!scopeAuthorization.canAccessInstitution(
                authentication, institutionId)) {
            requireTeacherSectionAccess(authentication, institutionId, student);
        }

        return buildReportCard(student, fromDate, toDate);
    }

    /**
     * A caller without institution-level access may read the report card only
     * when the student is actively enrolled in a section they currently teach.
     */
    private void requireTeacherSectionAccess(
            Authentication authentication,
            UUID institutionId,
            Student student
    ) {
        LocalDate today = LocalDate.now();

        Set<UUID> allowedSectionIds = teacherSectionAuthorization
                .findCurrentTeachingSectionIds(
                        authentication, institutionId, today);

        boolean allowed = !allowedSectionIds.isEmpty()
                && studentSectionResolver
                .findActiveSectionIds(student.getId(), today)
                .stream()
                .anyMatch(allowedSectionIds::contains);

        if (!allowed) {
            throw new AccessDeniedException(
                    "You do not have access to this student's report card");
        }
    }

    @Transactional(readOnly = true)
    public StudentReportCardResponse getMyReportCard(
            LocalDate fromDate,
            LocalDate toDate,
            Authentication authentication
    ) {
        Student student = currentStudentResolver.requireStudent(authentication);

        if (!student.isActive()) {
            throw new AccessDeniedException(
                    "Inactive students cannot access the student portal");
        }

        validateDateRange(fromDate, toDate);

        return buildReportCard(student, fromDate, toDate);
    }

    private StudentReportCardResponse buildReportCard(
            Student student,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        UUID studentId = student.getId();
        UUID institutionId = student.getInstitution().getId();

        List<StudentMark> marks =
                studentMarkRepository.findReportCardMarks(
                        studentId,
                        institutionId,
                        fromDate,
                        toDate
                );

        BigDecimal totalObtained = BigDecimal.ZERO;
        BigDecimal totalMaximum = BigDecimal.ZERO;

        Map<String, SubjectAccumulator> subjectTotals =
                new LinkedHashMap<>();

        List<AssessmentResultItem> assessmentResults =
                new ArrayList<>();

        for (StudentMark mark : marks) {
            var assessment = mark.getAssessment();
            String subjectName = assessment.getSubjectName();
            BigDecimal obtained = mark.getMarksObtained();
            BigDecimal maximum = assessment.getMaxMarks();

            totalObtained = totalObtained.add(obtained);
            totalMaximum = totalMaximum.add(maximum);

            SubjectAccumulator accumulator =
                    subjectTotals.computeIfAbsent(
                            subjectName,
                            ignored -> new SubjectAccumulator()
                    );

            accumulator.add(obtained, maximum);

            BigDecimal percentage =
                    gradeCalculator.calculatePercentage(obtained, maximum);

            assessmentResults.add(new AssessmentResultItem(
                    assessment.getId(),
                    assessment.getName(),
                    subjectName,
                    assessment.getAssessmentDate(),
                    obtained,
                    maximum,
                    percentage,
                    gradeCalculator.calculateGrade(percentage)
            ));
        }

        BigDecimal overallPercentage = totalMaximum.signum() > 0
                ? gradeCalculator.calculatePercentage(
                totalObtained, totalMaximum)
                : null;

        List<SubjectResultResponse> subjects =
                subjectTotals.entrySet().stream()
                        .map(entry -> toSubjectResult(
                                entry.getKey(), entry.getValue()))
                        .toList();

        return new StudentReportCardResponse(
                student.getId(),
                student.getAdmissionNumber(),
                student.getFirstName(),
                student.getLastName(),
                institutionId,
                fromDate,
                toDate,
                marks.size(),
                totalObtained,
                totalMaximum,
                overallPercentage,
                gradeCalculator.calculateGrade(overallPercentage),
                subjects,
                assessmentResults
        );
    }

    private SubjectResultResponse toSubjectResult(
            String subjectName,
            SubjectAccumulator accumulator
    ) {
        BigDecimal percentage = gradeCalculator.calculatePercentage(
                accumulator.obtained,
                accumulator.maximum
        );

        return new SubjectResultResponse(
                subjectName,
                accumulator.count,
                accumulator.obtained,
                accumulator.maximum,
                percentage,
                gradeCalculator.calculateGrade(percentage)
        );
    }

    private void validateDateRange(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        if (fromDate == null || toDate == null) {
            throw new BusinessRuleViolationException(
                    "Both fromDate and toDate are required");
        }

        if (fromDate.isAfter(toDate)) {
            throw new BusinessRuleViolationException(
                    "fromDate must not be after toDate");
        }

        if (ChronoUnit.DAYS.between(fromDate, toDate)
                > MAX_REPORT_RANGE_DAYS) {
            throw new BusinessRuleViolationException(
                    "Report date range cannot exceed 366 days");
        }
    }

    private static class SubjectAccumulator {
        private int count;
        private BigDecimal obtained = BigDecimal.ZERO;
        private BigDecimal maximum = BigDecimal.ZERO;

        private void add(
                BigDecimal marksObtained,
                BigDecimal maximumMarks
        ) {
            count++;
            obtained = obtained.add(marksObtained);
            maximum = maximum.add(maximumMarks);
        }
    }
}
