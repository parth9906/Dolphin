package com.school.dolphin.common.exception;

import com.school.dolphin.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ErrorResponse handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        return new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "RESOURCE_NOT_FOUND",
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ErrorResponse handleDuplicateResource(
            DuplicateResourceException exception,
            HttpServletRequest request
    ) {
        return new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "DUPLICATE_RESOURCE",
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ErrorResponse handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error ->
                        error.getField() + ": " + error.getDefaultMessage()
                )
                .collect(Collectors.joining(", "));

        return new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                message,
                request.getRequestURI()
        );
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleViolation(
            BusinessRuleViolationException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ErrorResponse(
                        OffsetDateTime.now(),
                        HttpStatus.UNPROCESSABLE_ENTITY.value(),
                        "BUSINESS_RULE_VIOLATION",
                        exception.getMessage(),
                        request.getRequestURI()
                ));
    }
}