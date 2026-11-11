package com.varellion.store.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for guest order lookup requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderLookupRequest {

    @NotBlank(message = "رقم الطلب مطلوب")
    private String orderNumber;

    @NotBlank(message = "رقم الهاتف مطلوب")
    @Pattern(
        regexp = "^(\\+?20|0020)?0?1[0125][0-9]{8}$",
        message = "رقم موبايل مصري غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)"
    )
    private String phone;
}
