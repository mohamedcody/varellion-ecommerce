package com.varellion.store.admin.order.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAdminNotesRequest {

    @Size(max = 1000, message = "ملاحظات الإدارة لا تتجاوز 1000 حرف")
    private String adminNotes;
}
