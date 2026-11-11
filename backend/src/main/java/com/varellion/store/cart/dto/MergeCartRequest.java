package com.varellion.store.cart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request payload for batch-merging guest cart items into an authenticated customer's cart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MergeCartRequest {

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<AddToCartRequest> items;
}
