package com.varellion.store;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
@EnableScheduling
public class VarellionApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(VarellionApplication.class, args);
    }

    /**
     * Automatically loads .env file into System properties if present.
     * Prevents "Could not resolve placeholder" errors during local development
     * while keeping application.properties strict and secrets out of git.
     */
    private static void loadDotEnv() {
        Path[] possiblePaths = new Path[]{
                Path.of(".env"),
                Path.of("backend/.env"),
                Path.of("../backend/.env"),
                Path.of("../.env")
        };

        for (Path path : possiblePaths) {
            if (Files.exists(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            String key = trimmed.substring(0, eqIdx).trim();
                            String value = trimmed.substring(eqIdx + 1).trim();

                            // Strip surrounding quotes if present
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }

                            // Only set if not already provided by system environment or flags
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                    // Fail silently and let Spring handle missing properties
                }
            }
        }
    }
}
