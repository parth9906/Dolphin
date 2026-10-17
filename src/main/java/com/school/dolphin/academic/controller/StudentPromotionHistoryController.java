package com.school.dolphin.academic.controller;

import com.school.dolphin.academic.dto.StudentPromotionHistoryResponse;
import com.school.dolphin.academic.service.StudentPromotionService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/academic/students")
public class StudentPromotionHistoryController {

    private final StudentPromotionService promotionService;

    public StudentPromotionHistoryController(
            StudentPromotionService promotionService
    ) {
        this.promotionService = promotionService;
    }

    @GetMapping("/{studentId}/promotion-history")
    @PreAuthorize("hasAuthority('STUDENT_PROMOTION_READ')")
    public List<StudentPromotionHistoryResponse> getPromotionHistory(
            @PathVariable UUID studentId,
            Authentication authentication
    ) {
        return promotionService.getStudentPromotionHistory(
                studentId, authentication);
    }
}