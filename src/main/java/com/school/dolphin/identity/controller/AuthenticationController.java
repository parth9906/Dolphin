package com.school.dolphin.identity.controller;

import com.school.dolphin.identity.dto.ChangePasswordRequest;
import com.school.dolphin.identity.dto.LoginRequest;
import com.school.dolphin.identity.dto.LoginResponse;
import com.school.dolphin.identity.service.AuthenticationService;
import com.school.dolphin.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserService userService;

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authenticationService.authenticate(request);
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        userService.changeOwnPassword(authentication, request);

        return Map.of(
                "status", "CHANGED",
                "message", "Password changed successfully"
        );
    }
}
