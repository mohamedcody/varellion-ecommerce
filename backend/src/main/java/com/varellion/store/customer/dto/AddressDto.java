package com.varellion.store.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Data Transfer Object for Customer Delivery Address (1:1 with Customer in V1).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    private UUID addressId;

    @NotBlank(message = "المحافظة مطلوبة")
    @Size(max = 100, message = "اسم المحافظة يجب ألا يتجاوز 100 حرف")
    private String governorate;

    @NotBlank(message = "المنطقة أو الحي مطلوب")
    @Size(max = 100, message = "اسم المنطقة يجب ألا يتجاوز 100 حرف")
    private String cityArea;

    @NotBlank(message = "العنوان بالتفصيل مطلوب")
    @Size(min = 5, message = "العنوان التفصيلي قصير جداً، يرجى توضيح بيانات الشارع والعمارة")
    private String detailedAddress;
}

