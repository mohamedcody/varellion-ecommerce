package com.varellion.store.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object representing the customer profile response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {

    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String username;
    private Boolean isActive;
    private AddressDto address;
    private OffsetDateTime createdAt;
}
