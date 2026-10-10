package com.school.dolphin.common.exception;

public class StaleResourceVersionException extends RuntimeException {

    public StaleResourceVersionException(String message) {
        super(message);
    }
}