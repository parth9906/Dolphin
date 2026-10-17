package com.school.dolphin.academic.controller;

import com.school.dolphin.academic.dto.*;
import com.school.dolphin.academic.service.StudentPromotionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic/promotion-batches")
public class StudentPromotionController {

    private final StudentPromotionService promotionService;

    public StudentPromotionController(
            StudentPromotionService promotionService
    ) {
        this.promotionService = promotionService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_CREATE')")
    public StudentPromotionBatchResponse createBatch(
            @Valid @RequestBody CreateStudentPromotionBatchRequest request,
            Authentication authentication
    ) {
        return promotionService.createBatch(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public List<StudentPromotionBatchResponse> getBatches(
            @RequestParam UUID institutionId,
            Authentication authentication
    ) {
        return promotionService.getBatches(
                institutionId, authentication);
    }

    @GetMapping("/{batchId}")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public StudentPromotionBatchResponse getBatch(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.getBatch(batchId, authentication);
    }

    @GetMapping("/{batchId}/items")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public List<StudentPromotionItemResponse> getBatchItems(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.getBatchItems(
                batchId, authentication);
    }

    @GetMapping("/{batchId}/preview")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public List<StudentPromotionItemResponse> previewBatch(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.previewBatch(
                batchId, authentication);
    }

    @PutMapping("/{batchId}/students/{studentId}/decision")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_UPDATE')")
    public StudentPromotionItemResponse updateDecision(
            @PathVariable UUID batchId,
            @PathVariable UUID studentId,
            @Valid @RequestBody UpdateStudentPromotionDecisionRequest request,
            Authentication authentication
    ) {
        return promotionService.updateDecision(
                batchId, studentId, request, authentication);
    }

    @PostMapping("/{batchId}/execute")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_EXECUTE')")
    public StudentPromotionBatchResponse executeBatch(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.executeBatch(
                batchId, authentication);
    }

    @PostMapping("/{batchId}/cancel")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_CANCEL')")
    public StudentPromotionBatchResponse cancelBatch(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.cancelBatch(
                batchId, authentication);
    }

    @PostMapping("/{batchId}/section-mappings")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_UPDATE')")
    public BulkStudentPromotionDecisionResponse applyBulkSectionMapping(
            @PathVariable UUID batchId,
            @Valid @RequestBody BulkStudentPromotionDecisionRequest request,
            Authentication authentication
    ) {
        return promotionService.applyBulkSectionMapping(
                batchId, request, authentication);
    }

    @GetMapping("/{batchId}/validation")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public StudentPromotionValidationResponse validateBatchReadiness(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        return promotionService.validateBatchReadiness(
                batchId, authentication);
    }

    @GetMapping(
            value = "/{batchId}/report.csv",
            produces = "text/csv"
    )
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public ResponseEntity<byte[]> exportBatchReport(
            @PathVariable UUID batchId,
            Authentication authentication
    ) {
        String csv = promotionService.exportExecutedBatchCsv(
                batchId, authentication);

        // UTF-8 BOM improves compatibility with spreadsheet applications.
        byte[] content = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "text/csv;charset=UTF-8"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"student-promotion-"
                                + batchId + ".csv\"")
                .contentLength(content.length)
                .body(content);
    }
}