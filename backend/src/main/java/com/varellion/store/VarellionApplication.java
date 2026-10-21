package com.varellion.store;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VarellionApplication {

    public static void main(String[] args) {
        SpringApplication.run(VarellionApplication.class, args);

        
    }
}
