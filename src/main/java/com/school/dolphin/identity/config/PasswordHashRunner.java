
package com.school.dolphin.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordHashRunner {

    @Bean
    CommandLineRunner printPasswordHash(PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println(
                    "DEV PASSWORD HASH: " +
                            passwordEncoder.encode("DevPassword@123")
            );
        };
    }
}