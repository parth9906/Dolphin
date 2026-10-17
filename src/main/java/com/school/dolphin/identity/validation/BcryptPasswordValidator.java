package com.school.dolphin.identity.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.nio.charset.StandardCharsets;

public class BcryptPasswordValidator
        implements ConstraintValidator<BcryptPassword, String> {

    private static final int MAX_BCRYPT_BYTES = 72;

    @Override
    public boolean isValid(
            String password,
            ConstraintValidatorContext context
    ) {
        // @NotBlank handles null and blank passwords.
        if (password == null) {
            return true;
        }

        int byteLength = password.getBytes(StandardCharsets.UTF_8).length;

        return byteLength <= MAX_BCRYPT_BYTES;
    }
}