package com.varellion.store.admin.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusCountDto {
    private long allOrders;
    private long pendingConfirmation;
    private long confirmed;
    private long preparing;
    private long shipped;
    private long delivered;
    private long deliveryFailed;
    private long cancelled;
    private long expired;
    private Map<String, Long> statusBreakdown;
}
