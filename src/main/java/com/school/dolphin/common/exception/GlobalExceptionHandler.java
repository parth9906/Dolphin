package com.school.dolphin.common.exception;

import com.school.dolphin.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(
                        OffsetDateTime.now(),
                        HttpStatus.NOT_FOUND.value(),
                        "RESOURCE_NOT_FOUND",
                        exception.getMessage(),
                        request.getRequestURI()
                ));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(
            DuplicateResourceException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(
                        OffsetDateTime.now(),
                        HttpStatus.CONFLICT.value(),
                        "DUPLICATE_RESOURCE",
                        exception.getMessage(),
                        request.getRequestURI()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
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

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        OffsetDateTime.now(),
                        HttpStatus.BAD_REQUEST.value(),
                        "VALIDATION_ERROR",
                        message,
                        request.getRequestURI()
                ));
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

    @ExceptionHandler(StaleResourceVersionException.class)
    public ResponseEntity<ErrorResponse> handleStaleResourceVersion(
            StaleResourceVersionException exception,
            HttpServletRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "CONCURRENT_MODIFICATION",
                exception.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockingFailure(
            ObjectOptimisticLockingFailureException exception,
            HttpServletRequest request
    ) {
        ErrorResponse response = new ErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "CONCURRENT_MODIFICATION",
                "This record was changed by another request. Reload it and try again.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
}