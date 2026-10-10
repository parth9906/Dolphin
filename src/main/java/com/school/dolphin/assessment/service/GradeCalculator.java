package com.school.dolphin.assessment.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

@Component
public class GradeCalculator {

    public BigDecimal calculatePercentage(
            BigDecimal marksObtained,
            BigDecimal maximumMarks
    ) {
        if (maximumMarks == null
                || maximumMarks.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Maximum marks must be greater than zero"
            );
        }

        return marksObtained
                .multiply(BigDecimal.valueOf(100))
                .divide(maximumMarks, 2, RoundingMode.HALF_UP);
    }

    public String calculateGrade(BigDecimal percentage) {
        if (percentage == null) {
            return "N/A";
        }

        if (percentage.compareTo(new BigDecimal("90")) >= 0) return "A+";
        if (percentage.compareTo(new BigDecimal("80")) >= 0) return "A";
        if (percentage.compareTo(new BigDecimal("70")) >= 0) return "B";
        if (percentage.compareTo(new BigDecimal("60")) >= 0) return "C";
        if (percentage.compareTo(new BigDecimal("50")) >= 0) return "D";
        if (percentage.compareTo(new BigDecimal("40")) >= 0) return "E";

        return "F";
    }
}