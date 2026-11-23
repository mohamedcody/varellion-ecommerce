package com.varellion.store.security.config;

import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocalAdminInitializer implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@varellion.com";
    private static final String ADMIN_PASSWORD = "Admin123456";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Override
    public void run(ApplicationArguments args) {
        String datasourceUrl = environment.getProperty("spring.datasource.url", "");
        if (!datasourceUrl.startsWith("jdbc:h2:")) {
            return;
        }

        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        userRepository.save(User.builder()
                .email(ADMIN_EMAIL)
                .username("admin")
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .role("ADMIN")
                .enabled(true)
                .emailVerified(true)
                .failedAttempts(0)
                .build());
    }
}
