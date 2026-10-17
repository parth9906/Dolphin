
package com.school.dolphin.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateClassSectionRequest(
        UUID campusId,

        @NotBlank
        @Size(max = 50)
        String name,

        @Positive
        Integer capacity
) {
}
