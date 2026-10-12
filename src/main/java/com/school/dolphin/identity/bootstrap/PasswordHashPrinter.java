package com.school.dolphin.identity.bootstrap;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHashPrinter implements CommandLineRunner {

    private static final String RAW_PASSWORD = "Admin@123";

    @Override
    public void run(String... args) {
        PasswordEncoder encoder =
                PasswordEncoderFactories.createDelegatingPasswordEncoder();

        System.out.println("password = " + RAW_PASSWORD);
        System.out.println("hash     = " + encoder.encode(RAW_PASSWORD));
    }
}
