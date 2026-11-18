package com.varellion.store.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCustomerDetailDto {
    private UUID customerId;
    private Long userAccountId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Boolean isActive;
    private String governorate;
    private String cityArea;
    private String detailedAddress;
    private long totalOrders;
    private BigDecimal totalSpent;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
