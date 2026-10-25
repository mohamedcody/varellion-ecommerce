package com.varellion.store.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables Spring Data JPA auditing for automatic createdAt and updatedAt handling.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
