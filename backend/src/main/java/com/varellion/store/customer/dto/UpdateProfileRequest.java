package com.varellion.store.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating customer personal information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "الاسم بالكامل مطلوب")
    @Size(min = 3, max = 150, message = "يجب أن يتراوح الاسم بين 50 و 150 حرفاً")
    private String fullName;

    @Pattern(
        regexp = "^$|^01[0125][0-9]{8}$",
        message = "رقم موبايل مصري غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)"
    )
    private String phoneNumber;
}
