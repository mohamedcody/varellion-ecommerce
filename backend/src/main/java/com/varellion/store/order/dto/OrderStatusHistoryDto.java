package com.varellion.store.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Status history audit entry for an order timeline.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryDto {
    private UUID historyId;
    private String previousStatus;
    private String newStatus;
    private String statusDisplayAr;
    private String statusDisplayEn;
    private String reason;
    private OffsetDateTime createdAt;
}
