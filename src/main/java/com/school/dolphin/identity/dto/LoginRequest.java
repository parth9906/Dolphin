package com.school.dolphin.identity.dto;

import com.school.dolphin.identity.validation.BcryptPassword;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        @BcryptPassword
        String password
) {
}