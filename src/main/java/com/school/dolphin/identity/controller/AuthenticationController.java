package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.LoginRequest;
import com.school.dolphin.identity.dto.LoginResponse;
import com.school.dolphin.identity.dto.UserResponse;
import com.school.dolphin.identity.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authenticationService.authenticate(request);
    }
}