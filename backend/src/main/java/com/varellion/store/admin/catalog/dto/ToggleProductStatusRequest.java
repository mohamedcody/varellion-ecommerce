package com.varellion.store.admin.catalog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload sent by administrators to quickly toggle a product's visibility status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToggleProductStatusRequest {

    @NotNull(message = "حالة المنتج مطلوبة")
    private Boolean isActive;
}
