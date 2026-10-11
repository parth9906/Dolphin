package com.school.dolphin.mess.controller;

import com.school.dolphin.mess.dto.CreateMessMealRequest;
import com.school.dolphin.mess.dto.MessMealResponse;
import com.school.dolphin.mess.dto.MessMealSummaryResponse;
import com.school.dolphin.mess.service.MessMealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mess/meals")
@RequiredArgsConstructor
public class MessMealController {

    private final MessMealService messMealService;

    @PostMapping
    @PreAuthorize("hasAuthority('MESS_MEAL_CREATE') "
            + "and hasAuthority('INVENTORY_STOCK_ISSUE')")
    public MessMealResponse create(
            @Valid @RequestBody CreateMessMealRequest request,
            Authentication authentication
    ) {
        return messMealService.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MESS_MEAL_READ')")
    public Page<MessMealSummaryResponse> search(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID campusId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @PageableDefault(size = 20, sort = "servedOn")
                    Pageable pageable,
            Authentication authentication
    ) {
        return messMealService.search(
                institutionId,
                campusId,
                fromDate,
                toDate,
                pageable,
                authentication);
    }

    @GetMapping("/{mealId}")
    @PreAuthorize("hasAuthority('MESS_MEAL_READ')")
    public MessMealResponse getById(
            @PathVariable UUID mealId,
            Authentication authentication
    ) {
        return messMealService.getById(mealId, authentication);
    }
}
