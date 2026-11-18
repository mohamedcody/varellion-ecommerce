package com.varellion.store.admin.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDeliveryAddressRequest {

    @NotBlank(message = "المحافظة مطلوبة")
    @Size(max = 100, message = "المحافظة لا تتجاوز 100 حرف")
    private String shippingGovernorate;

    @NotBlank(message = "المدينة/المنطقة مطلوبة")
    @Size(max = 100, message = "المدينة/المنطقة لا تتجاوز 100 حرف")
    private String shippingCityArea;

    @NotBlank(message = "العنوان بالتفصيل مطلوب")
    @Size(max = 500, message = "العنوان بالتفصيل لا يتجاوز 500 حرف")
    private String shippingDetailedAddress;

    private String customerPhone;
    private String customerName;
}
