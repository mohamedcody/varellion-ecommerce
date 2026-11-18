package com.varellion.store.admin.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Payload sent by administrators to update an existing catalog product.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "اسم المنتج باللغة العربية مطلوب")
    @Size(max = 255, message = "اسم المنتج لا يتجاوز 255 حرف")
    private String nameAr;

    @NotBlank(message = "Product English name is required")
    @Size(max = 255, message = "English name must not exceed 255 characters")
    private String nameEn;

    @NotNull(message = "معرف القسم مطلوب")
    private UUID categoryId;

    private String descriptionAr;
    private String descriptionEn;

    @NotNull(message = "سعر البيع مطلوب")
    @DecimalMin(value = "0.00", message = "السعر يجب أن يكون 0 أو أكثر")
    private BigDecimal price;

    @NotNull(message = "سعر التكلفة مطلوب")
    @DecimalMin(value = "0.00", message = "سعر التكلفة يجب أن يكون 0 أو أكثر")
    private BigDecimal costPrice;

    @NotNull(message = "كمية المخزون مطلوبة")
    @Min(value = 0, message = "المخزون يجب أن يكون 0 أو أكثر")
    private Integer stockQuantity;

    @NotBlank(message = "رمز المنتج SKU مطلوب")
    @Pattern(regexp = "^[A-Za-z0-9-_]+$", message = "صيغة SKU يجب أن تحتوي على أحرف وأرقام وشرطات فقط")
    @Size(max = 100, message = "رمز SKU لا يتجاوز 100 حرف")
    private String sku;

    @Builder.Default
    private Boolean isActive = true;

    @Valid
    @Builder.Default
    private List<CreateProductRequest.ProductImageInputDto> images = new ArrayList<>();
}
