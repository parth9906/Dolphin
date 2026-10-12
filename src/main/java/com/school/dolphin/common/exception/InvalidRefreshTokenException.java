package com.school.dolphin.common.exception;

/**
 * Raised when a refresh token is missing, unknown, expired, revoked, or has
 * been replayed after rotation. Deliberately does not distinguish these cases
 * in the API response to avoid leaking session state to a token holder.
 */
public class InvalidRefreshTokenException extends RuntimeException {

    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}
