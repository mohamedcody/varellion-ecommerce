package com.varellion.store.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request payload for creating an order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "اسم العميل مطلوب")
    private String customerName;

    @NotBlank(message = "رقم الهاتف مطلوب")
    private String customerPhone;

    @NotBlank(message = "المحافظة مطلوبة")
    private String shippingGovernorate;

    @NotBlank(message = "المنطقة أو المدينة مطلوبة")
    private String shippingCityArea;

    @NotBlank(message = "العنوان بالتفصيل مطلوب")
    private String shippingDetailedAddress;

    private String alternativePhone;

    @Builder.Default
    private String paymentMethod = "CASH_ON_DELIVERY";

    private String customerNotes;

    @NotEmpty(message = "يجب أن يحتوي الطلب على منتج واحد على الأقل")
    @Valid
    private List<CreateOrderItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderItemRequest {
        @NotNull(message = "معرف المنتج مطلوب")
        private UUID productId;

        @NotNull(message = "الكمية مطلوبة")
        @Positive(message = "يجب أن تكون الكمية أكبر من الصفر")
        private Integer quantity;
    }
}
