
package com.school.dolphin.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RecordMarksRequest(
        @NotEmpty @Size(max = 500)
        List<@Valid MarkEntry> records
) {
    public record MarkEntry(
            @NotNull UUID studentId,
            @NotNull @DecimalMin(value = "0.00") BigDecimal marksObtained,
            @Size(max = 500) String remarks
    ) {}
}