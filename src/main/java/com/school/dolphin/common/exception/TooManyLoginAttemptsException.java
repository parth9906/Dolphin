package com.school.dolphin.common.exception;

public class TooManyLoginAttemptsException extends RuntimeException {

    public TooManyLoginAttemptsException(String message) {
        super(message);
    }
}
