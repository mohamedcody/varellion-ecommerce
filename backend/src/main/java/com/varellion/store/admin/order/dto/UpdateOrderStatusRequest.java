package com.varellion.store.admin.order.dto;

import com.varellion.store.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by administrators to transition an order's lifecycle status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotNull(message = "حالة الطلب الجديدة مطلوبة")
    private OrderStatus newStatus;

    @Size(max = 500, message = "سبب تغيير الحالة لا يمكن أن يتجاوز 500 حرف")
    private String reason;
}
