package com.school.dolphin.academic.service;

import com.school.dolphin.academic.dto.*;
import com.school.dolphin.academic.entity.*;
import com.school.dolphin.academic.repository.*;
import com.school.dolphin.common.exception.BusinessRuleViolationException;
import com.school.dolphin.common.exception.DuplicateResourceException;
import com.school.dolphin.common.exception.ResourceNotFoundException;
import com.school.dolphin.identity.security.OrganizationScopeAuthorization;

import com.school.dolphin.student.entity.Student;
import com.school.dolphin.student.repository.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.ZoneId;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class StudentPromotionService {

    private final AcademicYearRepository academicYearRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentPromotionBatchRepository batchRepository;
    private final StudentPromotionBatchItemRepository itemRepository;
    private final ClassSectionRepository classSectionRepository;
    private final OrganizationScopeAuthorization scopeAuthorization;
    private final StudentRepository studentRepository;

    private final ZoneId schoolTimeZone;

    public StudentPromotionService(
            AcademicYearRepository academicYearRepository,
            StudentEnrollmentRepository studentEnrollmentRepository,
            StudentPromotionBatchRepository batchRepository,
            StudentPromotionBatchItemRepository itemRepository,
            ClassSectionRepository classSectionRepository,
            OrganizationScopeAuthorization scopeAuthorization,
            StudentRepository studentRepository,
            @Value("${app.school.time-zone:Asia/Kolkata}") String schoolTimeZone
    ) {
        this.academicYearRepository = academicYearRepository;
        this.studentEnrollmentRepository = studentEnrollmentRepository;
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
        this.classSectionRepository = classSectionRepository;
        this.scopeAuthorization = scopeAuthorization;
        this.studentRepository = studentRepository;
        this.schoolTimeZone = ZoneId.of(schoolTimeZone);
    }

    @Transactional
    public StudentPromotionBatchResponse createBatch(
            CreateStudentPromotionBatchRequest request,
            Authentication authentication
    ) {
        AcademicYear sourceYear = academicYearRepository
                .findById(request.sourceAcademicYearId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Source academic year not found"));

        AcademicYear targetYear = academicYearRepository
                .findById(request.targetAcademicYearId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Target academic year not found"));

        UUID institutionId = sourceYear.getInstitution().getId();

        requireInstitutionAccess(authentication, institutionId);

        if (!institutionId.equals(
                targetYear.getInstitution().getId())) {
            throw new BusinessRuleViolationException(
                    "Source and target academic years must belong "
                            + "to the same institution");
        }

        if (sourceYear.getId().equals(targetYear.getId())) {
            throw new BusinessRuleViolationException(
                    "Source and target academic years must be different");
        }

        validateYearDates(sourceYear, targetYear);

        if (sourceYear.getStatus() != AcademicYearStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "The source academic year must be active");
        }

        if (targetYear.getStatus() != AcademicYearStatus.PLANNED) {
            throw new BusinessRuleViolationException(
                    "The target academic year must be planned");
        }

        if (batchRepository
                .existsBySourceAcademicYear_IdAndTargetAcademicYear_IdAndStatus(
                        sourceYear.getId(),
                        targetYear.getId(),
                        PromotionBatchStatus.DRAFT)) {
            throw new DuplicateResourceException(
                    "A draft promotion batch already exists "
                            + "for these academic years");
        }

        List<StudentEnrollment> enrollments =
                studentEnrollmentRepository
                        .findByAcademicYearAndStatusOrdered(
                                sourceYear.getId(),
                                EnrollmentStatus.ACTIVE);

        if (enrollments.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "No active student enrollments were found "
                            + "in the source academic year");
        }

        StudentPromotionBatch batch = new StudentPromotionBatch();
        batch.setInstitution(sourceYear.getInstitution());
        batch.setSourceAcademicYear(sourceYear);
        batch.setTargetAcademicYear(targetYear);
        batch.setStatus(PromotionBatchStatus.DRAFT);

        batch = batchRepository.save(batch);

        for (StudentEnrollment enrollment : enrollments) {
            StudentPromotionBatchItem item =
                    new StudentPromotionBatchItem();

            item.setBatch(batch);
            item.setStudent(enrollment.getStudent());
            item.setSourceEnrollment(enrollment);
            item.setDecision(StudentPromotionDecision.PENDING);

            itemRepository.save(item);
        }

        return toBatchResponse(batch);
    }

    @Transactional(readOnly = true)
    public List<StudentPromotionBatchResponse> getBatches(
            UUID institutionId,
            Authentication authentication
    ) {
        requireInstitutionAccess(authentication, institutionId);

        return batchRepository
                .findByInstitution_IdOrderByCreatedAtDesc(institutionId)
                .stream()
                .map(this::toBatchResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentPromotionBatchResponse getBatch(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        return toBatchResponse(batch);
    }

    @Transactional(readOnly = true)
    public List<StudentPromotionItemResponse> getBatchItems(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        return itemRepository
                .findByBatch_IdOrderByStudent_AdmissionNumberAsc(batchId)
                .stream()
                .map(this::toItemResponse)
                .toList();
    }

    @Transactional
    public StudentPromotionItemResponse updateDecision(
            UUID batchId,
            UUID studentId,
            UpdateStudentPromotionDecisionRequest request,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        requireDraftBatch(batch);

        StudentPromotionBatchItem item = itemRepository
                .findByBatch_IdAndStudent_Id(batchId, studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student is not part of this promotion batch"));

        StudentPromotionDecision decision = request.decision();

        if (decision == null) {
            throw new BusinessRuleViolationException(
                    "A promotion decision is required");
        }

        ClassSection targetSection = null;

        boolean needsTarget =
                decision == StudentPromotionDecision.PROMOTE
                        || decision == StudentPromotionDecision.HOLD_BACK;

        if (needsTarget) {
            if (request.targetSectionId() == null) {
                throw new BusinessRuleViolationException(
                        "A target section is required for PROMOTE "
                                + "and HOLD_BACK decisions");
            }

            targetSection = classSectionRepository
                    .findById(request.targetSectionId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Target section not found"));

            validateTargetSection(batch, targetSection);

            if (!item.getStudent().isActive()) {
                throw new BusinessRuleViolationException(
                        "An inactive student cannot be promoted "
                                + "or held back");
            }
        } else if (request.targetSectionId() != null) {
            throw new BusinessRuleViolationException(
                    "A target section must only be specified "
                            + "for PROMOTE or HOLD_BACK decisions");
        }

        item.setDecision(decision);
        item.setTargetSection(targetSection);
        item.setReason(normalizeReason(request.reason()));

        return toItemResponse(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<StudentPromotionItemResponse> previewBatch(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        return itemRepository
                .findByBatch_IdOrderByStudent_AdmissionNumberAsc(batchId)
                .stream()
                .map(this::toItemResponse)
                .toList();
    }

    @Transactional
    public StudentPromotionBatchResponse executeBatch(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        requireDraftBatch(batch);

        AcademicYear sourceYear = batch.getSourceAcademicYear();
        AcademicYear targetYear = batch.getTargetAcademicYear();

        if (sourceYear.getStatus() != AcademicYearStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "The source academic year must still be active");
        }

        if (targetYear.getStatus() != AcademicYearStatus.PLANNED) {
            throw new BusinessRuleViolationException(
                    "The target academic year must still be planned");
        }

        validateYearDates(sourceYear, targetYear);

        LocalDate today = LocalDate.now(schoolTimeZone);

        if (today.isBefore(targetYear.getStartDate())) {
            throw new BusinessRuleViolationException(
                    "Promotion cannot be executed before the target "
                            + "academic year starts on "
                            + targetYear.getStartDate());
        }

        List<StudentPromotionBatchItem> items =
                itemRepository
                        .findByBatch_IdOrderByStudent_AdmissionNumberAsc(
                                batchId);

        if (items.isEmpty()) {
            throw new BusinessRuleViolationException(
                    "The promotion batch contains no students");
        }

        for (StudentPromotionBatchItem item : items) {
            validateItemForExecution(batch, item);
        }

        validateSourceRosterUnchanged(batch, items);

        validateTargetCapacities(items);

        /*
         * End the old enrollments before creating new active enrollments.
         * The database has a unique index allowing only one ACTIVE
         * enrollment per student.
         */
        for (StudentPromotionBatchItem item : items) {
            StudentEnrollment sourceEnrollment =
                    item.getSourceEnrollment();

            sourceEnrollment.setEndDate(sourceYear.getEndDate());

            if (item.getDecision() == StudentPromotionDecision.WITHDRAW) {
                sourceEnrollment.setStatus(EnrollmentStatus.WITHDRAWN);
            } else {
                sourceEnrollment.setStatus(EnrollmentStatus.COMPLETED);
            }
        }

        List<StudentEnrollment> sourceEnrollments =
                items.stream()
                        .map(StudentPromotionBatchItem::getSourceEnrollment)
                        .toList();

        studentEnrollmentRepository.saveAllAndFlush(sourceEnrollments);

        // Finalize the source year and activate the target year.
        sourceYear.setStatus(AcademicYearStatus.CLOSED);
        targetYear.setStatus(AcademicYearStatus.ACTIVE);

        academicYearRepository.save(sourceYear);
        academicYearRepository.save(targetYear);
        academicYearRepository.flush();

        // EXCLUDE students receive no new enrollment.
        for (StudentPromotionBatchItem item : items) {
            StudentPromotionDecision decision = item.getDecision();

            if (decision == StudentPromotionDecision.EXCLUDE
                    || decision == StudentPromotionDecision.WITHDRAW) {
                continue;
            }

            StudentEnrollment targetEnrollment =
                    new StudentEnrollment();

            targetEnrollment.setStudent(item.getStudent());
            targetEnrollment.setSection(item.getTargetSection());
            targetEnrollment.setStartDate(targetYear.getStartDate());
            targetEnrollment.setStatus(EnrollmentStatus.ACTIVE);

            StudentEnrollment savedEnrollment =
                    studentEnrollmentRepository.save(targetEnrollment);

            item.setTargetEnrollment(savedEnrollment);
        }

        studentEnrollmentRepository.flush();

        itemRepository.saveAll(items);

        batch.setStatus(PromotionBatchStatus.EXECUTED);
        batch.setExecutedAt(OffsetDateTime.now());

        batchRepository.save(batch);

        return toBatchResponse(batch);
    }

    @Transactional
    public StudentPromotionBatchResponse cancelBatch(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        requireDraftBatch(batch);

        batch.setStatus(PromotionBatchStatus.CANCELLED);

        return toBatchResponse(batchRepository.save(batch));
    }

    private void validateItemForExecution(
            StudentPromotionBatch batch,
            StudentPromotionBatchItem item
    ) {
        if (item.getDecision() == StudentPromotionDecision.PENDING) {
            throw new BusinessRuleViolationException(
                    "Every student must have a decision before execution");
        }

        StudentEnrollment sourceEnrollment =
                item.getSourceEnrollment();

        if (sourceEnrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "A source enrollment is no longer active. "
                            + "Cancel and recreate the promotion batch.");
        }

        UUID sourceYearId = sourceEnrollment.getSection()
                .getSchoolClass().getAcademicYear().getId();

        if (!sourceYearId.equals(
                batch.getSourceAcademicYear().getId())) {
            throw new BusinessRuleViolationException(
                    "A source enrollment does not belong "
                            + "to the batch's source academic year");
        }

        boolean needsTarget =
                item.getDecision() == StudentPromotionDecision.PROMOTE
                        || item.getDecision()
                        == StudentPromotionDecision.HOLD_BACK;

        if (needsTarget) {
            if (item.getTargetSection() == null) {
                throw new BusinessRuleViolationException(
                        "A target section is required for every "
                                + "PROMOTE or HOLD_BACK decision");
            }

            if (!item.getStudent().isActive()) {
                throw new BusinessRuleViolationException(
                        "An inactive student cannot be promoted "
                                + "or held back");
            }

            validateTargetSection(batch, item.getTargetSection());
        } else if (item.getTargetSection() != null) {
            throw new BusinessRuleViolationException(
                    "EXCLUDE decisions must not have a target section");
        }
    }

    @Transactional(readOnly = true)
    public List<StudentPromotionHistoryResponse> getStudentPromotionHistory(
            UUID studentId,
            Authentication authentication
    ) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student not found"));

        requireInstitutionAccess(
                authentication, student.getInstitution().getId());

        return itemRepository
                .findByStudent_IdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(this::toPromotionHistoryResponse)
                .toList();
    }

    @Transactional
    public BulkStudentPromotionDecisionResponse applyBulkSectionMapping(
            UUID batchId,
            BulkStudentPromotionDecisionRequest request,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        requireDraftBatch(batch);

        StudentPromotionDecision decision = request.decision();

        if (decision != StudentPromotionDecision.PROMOTE
                && decision != StudentPromotionDecision.HOLD_BACK) {
            throw new BusinessRuleViolationException(
                    "Bulk section mapping only supports PROMOTE or HOLD_BACK");
        }

        ClassSection targetSection = classSectionRepository
                .findById(request.targetSectionId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Target section not found"));

        validateTargetSection(batch, targetSection);

        List<StudentPromotionBatchItem> sectionItems =
                itemRepository
                        .findByBatch_IdOrderByStudent_AdmissionNumberAsc(batchId)
                        .stream()
                        .filter(item -> item.getSourceEnrollment()
                                .getSection().getId()
                                .equals(request.sourceSectionId()))
                        .toList();

        if (sectionItems.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No students from the specified source section "
                            + "are present in this promotion batch");
        }

        long alreadyDecidedCount = sectionItems.stream()
                .filter(item ->
                        item.getDecision() != StudentPromotionDecision.PENDING)
                .count();

        long skippedInactiveCount = 0;
        long updatedCount = 0;

        String reason = normalizeReason(request.reason());

        for (StudentPromotionBatchItem item : sectionItems) {
            // Keep any existing individual decision unchanged.
            if (item.getDecision() != StudentPromotionDecision.PENDING) {
                continue;
            }

            // Leave inactive students pending for an individual decision.
            if (!item.getStudent().isActive()) {
                skippedInactiveCount++;
                continue;
            }

            item.setDecision(decision);
            item.setTargetSection(targetSection);
            item.setReason(reason);

            updatedCount++;
        }

        if (updatedCount > 0) {
            itemRepository.saveAll(sectionItems);
        }

        return new BulkStudentPromotionDecisionResponse(
                batchId,
                request.sourceSectionId(),
                targetSection.getId(),
                decision,
                updatedCount,
                skippedInactiveCount,
                alreadyDecidedCount
        );
    }

    @Transactional(readOnly = true)
    public StudentPromotionValidationResponse validateBatchReadiness(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        List<StudentPromotionBatchItem> items =
                itemRepository.findByBatch_IdOrderByStudent_AdmissionNumberAsc(
                        batchId);

        List<String> issues = new ArrayList<>();

        AcademicYear sourceYear = batch.getSourceAcademicYear();
        AcademicYear targetYear = batch.getTargetAcademicYear();

        if (batch.getStatus() != PromotionBatchStatus.DRAFT) {
            issues.add("Only a draft promotion batch can be executed.");
        }

        if (sourceYear.getStatus() != AcademicYearStatus.ACTIVE) {
            issues.add("The source academic year must be active.");
        }

        if (targetYear.getStatus() != AcademicYearStatus.PLANNED) {
            issues.add("The target academic year must be planned.");
        }

        if (!targetYear.getStartDate().isAfter(sourceYear.getEndDate())) {
            issues.add(
                    "The target academic year must start after "
                            + "the source academic year ends.");
        }

        if (items.isEmpty()) {
            issues.add("The promotion batch contains no students.");
        }

        Set<UUID> batchEnrollmentIds = new HashSet<>();
        Map<UUID, Long> assignedPerSection = new HashMap<>();
        Map<UUID, ClassSection> targetSections = new HashMap<>();

        for (StudentPromotionBatchItem item : items) {
            Student student = item.getStudent();
            StudentEnrollment sourceEnrollment = item.getSourceEnrollment();

            String studentLabel = student.getAdmissionNumber();

            batchEnrollmentIds.add(sourceEnrollment.getId());

            if (sourceEnrollment.getStatus() != EnrollmentStatus.ACTIVE) {
                issues.add(
                        "Student " + studentLabel
                                + ": source enrollment is no longer active.");
            }

            UUID actualSourceYearId = sourceEnrollment.getSection()
                    .getSchoolClass().getAcademicYear().getId();

            if (!actualSourceYearId.equals(sourceYear.getId())) {
                issues.add(
                        "Student " + studentLabel
                                + ": source enrollment does not belong "
                                + "to the selected source academic year.");
            }

            StudentPromotionDecision decision = item.getDecision();

            if (decision == StudentPromotionDecision.PENDING) {
                issues.add(
                        "Student " + studentLabel
                                + ": promotion decision is still pending.");
                continue;
            }

            boolean requiresTarget =
                    decision == StudentPromotionDecision.PROMOTE
                            || decision == StudentPromotionDecision.HOLD_BACK;

            if (!requiresTarget) {
                if (item.getTargetSection() != null) {
                    issues.add(
                            "Student " + studentLabel
                                    + ": this decision must not have "
                                    + "a target section.");
                }
                continue;
            }

            ClassSection section = item.getTargetSection();

            if (section == null) {
                issues.add(
                        "Student " + studentLabel
                                + ": a target section is required.");
                continue;
            }

            if (!student.isActive()) {
                issues.add(
                        "Student " + studentLabel
                                + ": inactive students cannot be promoted "
                                + "or held back.");
            }

            SchoolClass targetClass = section.getSchoolClass();
            AcademicYear sectionYear = targetClass.getAcademicYear();

            if (!section.isActive() || !targetClass.isActive()) {
                issues.add(
                        "Student " + studentLabel
                                + ": target section and class must be active.");
                continue;
            }

            if (!sectionYear.getId().equals(targetYear.getId())) {
                issues.add(
                        "Student " + studentLabel
                                + ": target section does not belong "
                                + "to the selected target academic year.");
                continue;
            }

            if (!sectionYear.getInstitution().getId().equals(
                    batch.getInstitution().getId())) {
                issues.add(
                        "Student " + studentLabel
                                + ": target section belongs to another institution.");
                continue;
            }

            assignedPerSection.merge(section.getId(), 1L, Long::sum);
            targetSections.put(section.getId(), section);
        }

        List<StudentEnrollment> currentSourceEnrollments =
                studentEnrollmentRepository.findByAcademicYearAndStatusOrdered(
                        sourceYear.getId(), EnrollmentStatus.ACTIVE);

        Set<UUID> currentEnrollmentIds = new HashSet<>();

        for (StudentEnrollment enrollment : currentSourceEnrollments) {
            currentEnrollmentIds.add(enrollment.getId());
        }

        if (!batchEnrollmentIds.equals(currentEnrollmentIds)) {
            issues.add(
                    "The source roster has changed since the batch was created. "
                            + "Cancel this batch and create a new one.");
        }

        for (Map.Entry<UUID, Long> assignment
                : assignedPerSection.entrySet()) {

            ClassSection section = targetSections.get(assignment.getKey());
            Integer capacity = section.getCapacity();

            if (capacity == null) {
                continue;
            }

            long currentEnrollmentCount =
                    studentEnrollmentRepository.countBySection_IdAndStatus(
                            section.getId(), EnrollmentStatus.ACTIVE);

            long projectedEnrollmentCount =
                    currentEnrollmentCount + assignment.getValue();

            if (projectedEnrollmentCount > capacity) {
                issues.add(
                        "Target section '" + section.getName()
                                + "' exceeds its capacity. Capacity: "
                                + capacity + ", projected enrollment: "
                                + projectedEnrollmentCount + ".");
            }
        }

        return new StudentPromotionValidationResponse(
                batch.getId(),
                batch.getStatus(),
                issues.isEmpty(),
                items.size(),
                countDecision(items, StudentPromotionDecision.PENDING),
                countDecision(items, StudentPromotionDecision.PROMOTE),
                countDecision(items, StudentPromotionDecision.HOLD_BACK),
                countDecision(items, StudentPromotionDecision.WITHDRAW),
                countDecision(items, StudentPromotionDecision.EXCLUDE),
                List.copyOf(issues)
        );
    }

    @Transactional(readOnly = true)
    public String exportExecutedBatchCsv(
            UUID batchId,
            Authentication authentication
    ) {
        StudentPromotionBatch batch = getBatchOrThrow(batchId);

        requireInstitutionAccess(
                authentication, batch.getInstitution().getId());

        if (batch.getStatus() != PromotionBatchStatus.EXECUTED) {
            throw new BusinessRuleViolationException(
                    "Only an executed promotion batch can be exported");
        }

        List<StudentPromotionBatchItem> items =
                itemRepository.findByBatch_IdOrderByStudent_AdmissionNumberAsc(
                        batchId);

        StringBuilder csv = new StringBuilder();

        appendCsvRow(csv,
                "Batch ID",
                "Batch Status",
                "Executed At",
                "Student ID",
                "Admission Number",
                "Student Name",
                "Source Academic Year",
                "Source Class",
                "Source Section",
                "Source Enrollment ID",
                "Source Enrollment End Date",
                "Source Enrollment Status",
                "Decision",
                "Decision Reason",
                "Target Academic Year",
                "Target Class",
                "Target Section",
                "Target Enrollment ID",
                "Target Enrollment Start Date",
                "Target Enrollment Status"
        );

        for (StudentPromotionBatchItem item : items) {
            Student student = item.getStudent();

            StudentEnrollment sourceEnrollment =
                    item.getSourceEnrollment();

            ClassSection sourceSection = sourceEnrollment.getSection();
            SchoolClass sourceClass = sourceSection.getSchoolClass();

            ClassSection targetSection = item.getTargetSection();
            SchoolClass targetClass = targetSection == null
                    ? null
                    : targetSection.getSchoolClass();

            StudentEnrollment targetEnrollment =
                    item.getTargetEnrollment();

            String studentName = (
                    student.getFirstName() + " "
                            + (student.getLastName() == null
                            ? ""
                            : student.getLastName())
            ).trim();

            appendCsvRow(csv,
                    batch.getId().toString(),
                    batch.getStatus().name(),
                    formatCsvValue(batch.getExecutedAt()),
                    student.getId().toString(),
                    student.getAdmissionNumber(),
                    studentName,
                    batch.getSourceAcademicYear().getName(),
                    sourceClass.getName(),
                    sourceSection.getName(),
                    sourceEnrollment.getId().toString(),
                    formatCsvValue(sourceEnrollment.getEndDate()),
                    sourceEnrollment.getStatus().name(),
                    item.getDecision().name(),
                    item.getReason(),
                    batch.getTargetAcademicYear().getName(),
                    targetClass == null ? null : targetClass.getName(),
                    targetSection == null ? null : targetSection.getName(),
                    targetEnrollment == null
                            ? null
                            : targetEnrollment.getId().toString(),
                    targetEnrollment == null
                            ? null
                            : formatCsvValue(targetEnrollment.getStartDate()),
                    targetEnrollment == null
                            ? null
                            : targetEnrollment.getStatus().name()
            );
        }

        return csv.toString();
    }

    private long countDecision(
            List<StudentPromotionBatchItem> items,
            StudentPromotionDecision decision
    ) {
        return items.stream()
                .filter(item -> item.getDecision() == decision)
                .count();
    }

    private StudentPromotionHistoryResponse toPromotionHistoryResponse(
            StudentPromotionBatchItem item
    ) {
        StudentPromotionBatch batch = item.getBatch();
        Student student = item.getStudent();

        StudentEnrollment sourceEnrollment = item.getSourceEnrollment();
        ClassSection sourceSection = sourceEnrollment.getSection();
        SchoolClass sourceClass = sourceSection.getSchoolClass();

        AcademicYear sourceYear = sourceClass.getAcademicYear();
        AcademicYear targetYear = batch.getTargetAcademicYear();

        ClassSection targetSection = item.getTargetSection();
        SchoolClass targetClass = targetSection == null
                ? null
                : targetSection.getSchoolClass();

        StudentEnrollment targetEnrollment = item.getTargetEnrollment();

        String studentName = (
                student.getFirstName() + " "
                        + (student.getLastName() == null
                        ? ""
                        : student.getLastName())
        ).trim();

        return new StudentPromotionHistoryResponse(
                batch.getId(),
                batch.getStatus(),

                student.getId(),
                student.getAdmissionNumber(),
                studentName,

                sourceYear.getId(),
                sourceYear.getName(),
                sourceEnrollment.getId(),
                sourceEnrollment.getStartDate(),
                sourceEnrollment.getEndDate(),
                sourceEnrollment.getStatus(),
                sourceClass.getId(),
                sourceClass.getName(),
                sourceSection.getId(),
                sourceSection.getName(),

                item.getDecision(),
                item.getReason(),

                targetYear.getId(),
                targetYear.getName(),
                targetClass == null ? null : targetClass.getId(),
                targetClass == null ? null : targetClass.getName(),
                targetSection == null ? null : targetSection.getId(),
                targetSection == null ? null : targetSection.getName(),

                targetEnrollment == null ? null : targetEnrollment.getId(),
                targetEnrollment == null ? null : targetEnrollment.getStartDate(),
                targetEnrollment == null ? null : targetEnrollment.getEndDate(),
                targetEnrollment == null ? null : targetEnrollment.getStatus(),

                batch.getCreatedAt(),
                batch.getExecutedAt()
        );
    }

    private void validateSourceRosterUnchanged(
            StudentPromotionBatch batch,
            List<StudentPromotionBatchItem> items
    ) {
        Set<UUID> batchEnrollmentIds = new HashSet<>();

        for (StudentPromotionBatchItem item : items) {
            batchEnrollmentIds.add(
                    item.getSourceEnrollment().getId());
        }

        List<StudentEnrollment> currentSourceEnrollments =
                studentEnrollmentRepository
                        .findByAcademicYearAndStatusOrdered(
                                batch.getSourceAcademicYear().getId(),
                                EnrollmentStatus.ACTIVE);

        Set<UUID> currentEnrollmentIds = new HashSet<>();

        for (StudentEnrollment enrollment : currentSourceEnrollments) {
            currentEnrollmentIds.add(enrollment.getId());
        }

        if (!batchEnrollmentIds.equals(currentEnrollmentIds)) {
            throw new BusinessRuleViolationException(
                    "The source enrollment roster has changed "
                            + "since this batch was created. "
                            + "Cancel it and create a new promotion batch.");
        }
    }

    private void validateTargetCapacities(
            List<StudentPromotionBatchItem> items
    ) {
        Map<UUID, Long> assignmentsPerSection = new HashMap<>();
        Map<UUID, ClassSection> sections = new HashMap<>();

        for (StudentPromotionBatchItem item : items) {
            if (item.getDecision() == StudentPromotionDecision.EXCLUDE
                    || item.getDecision() == StudentPromotionDecision.WITHDRAW) {
                continue;
            }

            ClassSection section = item.getTargetSection();

            assignmentsPerSection.merge(section.getId(), 1L, Long::sum);
            sections.put(section.getId(), section);
        }

        for (Map.Entry<UUID, Long> assignment
                : assignmentsPerSection.entrySet()) {

            ClassSection section = sections.get(assignment.getKey());
            Integer capacity = section.getCapacity();

            if (capacity == null) {
                continue;
            }

            long alreadyEnrolled =
                    studentEnrollmentRepository.countBySection_IdAndStatus(
                            section.getId(), EnrollmentStatus.ACTIVE);

            long totalAfterPromotion =
                    alreadyEnrolled + assignment.getValue();

            if (totalAfterPromotion > capacity) {
                throw new BusinessRuleViolationException(
                        "Section '" + section.getName()
                                + "' does not have enough capacity "
                                + "for all assigned students");
            }
        }
    }

    private void validateTargetSection(
            StudentPromotionBatch batch,
            ClassSection section
    ) {
        SchoolClass schoolClass = section.getSchoolClass();
        AcademicYear sectionYear = schoolClass.getAcademicYear();

        if (!section.isActive() || !schoolClass.isActive()) {
            throw new BusinessRuleViolationException(
                    "The target section and its class must be active");
        }

        if (!sectionYear.getId().equals(
                batch.getTargetAcademicYear().getId())) {
            throw new BusinessRuleViolationException(
                    "The target section must belong "
                            + "to the batch's target academic year");
        }

        if (!sectionYear.getInstitution().getId().equals(
                batch.getInstitution().getId())) {
            throw new BusinessRuleViolationException(
                    "The target section must belong "
                            + "to the batch's institution");
        }
    }

    private void validateYearDates(
            AcademicYear sourceYear,
            AcademicYear targetYear
    ) {
        if (!targetYear.getStartDate().isAfter(
                sourceYear.getEndDate())) {
            throw new BusinessRuleViolationException(
                    "The target academic year must start "
                            + "after the source academic year ends");
        }
    }

    private StudentPromotionBatch getBatchOrThrow(UUID batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Promotion batch not found"));
    }

    private void requireDraftBatch(StudentPromotionBatch batch) {
        if (batch.getStatus() != PromotionBatchStatus.DRAFT) {
            throw new BusinessRuleViolationException(
                    "Only a draft promotion batch can be modified, "
                            + "executed, or cancelled");
        }
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

    private String normalizeReason(String reason) {
        return reason == null || reason.isBlank()
                ? null
                : reason.trim();
    }

    private StudentPromotionBatchResponse toBatchResponse(
            StudentPromotionBatch batch
    ) {
        UUID batchId = batch.getId();

        return new StudentPromotionBatchResponse(
                batchId,
                batch.getInstitution().getId(),
                batch.getSourceAcademicYear().getId(),
                batch.getSourceAcademicYear().getName(),
                batch.getTargetAcademicYear().getId(),
                batch.getTargetAcademicYear().getName(),
                batch.getStatus(),
                itemRepository.countByBatch_Id(batchId),
                itemRepository.countByBatch_IdAndDecision(
                        batchId, StudentPromotionDecision.PENDING),
                itemRepository.countByBatch_IdAndDecision(
                        batchId, StudentPromotionDecision.PROMOTE),
                itemRepository.countByBatch_IdAndDecision(
                        batchId, StudentPromotionDecision.HOLD_BACK),
                itemRepository.countByBatch_IdAndDecision(
                        batchId, StudentPromotionDecision.WITHDRAW),
                itemRepository.countByBatch_IdAndDecision(
                        batchId, StudentPromotionDecision.EXCLUDE),
                batch.getCreatedAt(),
                batch.getExecutedAt()
        );
    }

    private StudentPromotionItemResponse toItemResponse(
            StudentPromotionBatchItem item
    ) {
        Student student = item.getStudent();

        StudentEnrollment sourceEnrollment =
                item.getSourceEnrollment();

        ClassSection sourceSection = sourceEnrollment.getSection();
        SchoolClass sourceClass = sourceSection.getSchoolClass();

        ClassSection targetSection = item.getTargetSection();

        SchoolClass targetClass = targetSection == null
                ? null
                : targetSection.getSchoolClass();

        return new StudentPromotionItemResponse(
                item.getId(),
                student.getId(),
                student.getAdmissionNumber(),
                student.getFirstName() + " "
                        + (student.getLastName() == null
                        ? ""
                        : student.getLastName()).trim(),
                sourceEnrollment.getId(),
                sourceSection.getId(),
                sourceSection.getName(),
                sourceClass.getId(),
                sourceClass.getName(),
                item.getDecision(),
                targetSection == null ? null : targetSection.getId(),
                targetSection == null ? null : targetSection.getName(),
                targetClass == null ? null : targetClass.getId(),
                targetClass == null ? null : targetClass.getName(),
                item.getReason(),
                item.getTargetEnrollment() == null
                        ? null
                        : item.getTargetEnrollment().getId()
        );
    }

    private void appendCsvRow(
            StringBuilder csv,
            String... values
    ) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                csv.append(',');
            }

            String value = values[i];

            if (value == null) {
                csv.append("\"\"");
                continue;
            }

            String trimmed = value.stripLeading();

            // Protect spreadsheet users against CSV formula injection.
            if (!value.isEmpty()
                    && ("=+-@\t\r\n".indexOf(value.charAt(0)) >= 0
                    || (!trimmed.isEmpty()
                    && "=+-@".indexOf(trimmed.charAt(0)) >= 0))) {
                value = "'" + value;
            }

            csv.append('"')
                    .append(value.replace("\"", "\"\""))
                    .append('"');
        }

        csv.append("\r\n");
    }

    private String formatCsvValue(Object value) {
        return value == null ? null : value.toString();
    }
}