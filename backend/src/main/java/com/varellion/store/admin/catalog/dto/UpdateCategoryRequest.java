package com.varellion.store.admin.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryRequest {

    @NotBlank(message = "اسم القسم باللغة العربية مطلوب")
    @Size(max = 100, message = "اسم القسم لا يتجاوز 100 حرف")
    private String nameAr;

    @NotBlank(message = "Category English name is required")
    @Size(max = 100, message = "English name must not exceed 100 characters")
    private String nameEn;

    @NotBlank(message = "الرابط الدائم (slug) مطلوب")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "صيغة الرابط الدائم (slug) غير صحيحة، يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط")
    @Size(max = 100, message = "الرابط الدائم لا يتجاوز 100 حرف")
    private String slug;

    private String descriptionAr;
    private String descriptionEn;
    private Boolean isActive;
}
