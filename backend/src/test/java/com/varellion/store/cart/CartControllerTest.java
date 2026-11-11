package com.varellion.store.cart;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.cart.controller.CartController;
import com.varellion.store.cart.dto.*;
import com.varellion.store.cart.service.CartService;
import com.varellion.store.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CartService cartService;

    @InjectMocks
    private CartController cartController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UserDetails mockUserDetails = new User(
            "user@test.com",
            "password",
            Collections.emptyList()
    );

    private CartDto sampleCartDto;
    private UUID sampleCartId;
    private UUID sampleItemId;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(cartController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleCartId = UUID.randomUUID();
        sampleItemId = UUID.randomUUID();

        sampleCartDto = CartDto.builder()
                .cartId(sampleCartId)
                .customerId(UUID.randomUUID())
                .items(List.of(
                        CartItemDto.builder()
                                .cartItemId(sampleItemId)
                                .productId(UUID.randomUUID())
                                .nameAr("قميص كلاسيك")
                                .nameEn("Classic Shirt")
                                .price(new BigDecimal("500.00"))
                                .quantity(2)
                                .subtotal(new BigDecimal("1000.00"))
                                .availableStock(10)
                                .build()
                ))
                .totalItems(2)
                .subtotal(new BigDecimal("1000.00"))
                .freeShippingThreshold(new BigDecimal("2500.00"))
                .amountForFreeShipping(new BigDecimal("1500.00"))
                .build();
    }

    @Test
    @DisplayName("GET /api/cart: Returns customer cart successfully")
    void getCart_returnsCart() throws Exception {
        when(cartService.getCart("user@test.com")).thenReturn(sampleCartDto);

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cartId").value(sampleCartId.toString()))
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.subtotal").value(1000.00));
    }

    @Test
    @DisplayName("POST /api/cart/items: Adds item to cart successfully")
    void addItem_success() throws Exception {
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(UUID.randomUUID())
                .quantity(2)
                .build();

        when(cartService.addItem(eq("user@test.com"), any(AddToCartRequest.class))).thenReturn(sampleCartDto);

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cartId").value(sampleCartId.toString()));
    }

    @Test
    @DisplayName("PUT /api/cart/items/{cartItemId}: Updates item quantity")
    void updateQuantity_success() throws Exception {
        UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                .quantity(5)
                .build();

        when(cartService.updateItemQuantity(eq("user@test.com"), eq(sampleItemId), eq(5))).thenReturn(sampleCartDto);

        mockMvc.perform(put("/api/cart/items/" + sampleItemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/cart/items/{cartItemId}: Removes item from cart")
    void removeItem_success() throws Exception {
        when(cartService.removeItem(eq("user@test.com"), eq(sampleItemId))).thenReturn(sampleCartDto);

        mockMvc.perform(delete("/api/cart/items/" + sampleItemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/cart: Clears all items from cart")
    void clearCart_success() throws Exception {
        doNothing().when(cartService).clearCart("user@test.com");

        mockMvc.perform(delete("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cartService).clearCart("user@test.com");
    }

    @Test
    @DisplayName("POST /api/cart/merge: Batch merges guest cart items")
    void mergeCart_success() throws Exception {
        MergeCartRequest request = MergeCartRequest.builder()
                .items(List.of(
                        AddToCartRequest.builder().productId(UUID.randomUUID()).quantity(2).build()
                ))
                .build();

        when(cartService.mergeCart(eq("user@test.com"), any(MergeCartRequest.class))).thenReturn(sampleCartDto);

        mockMvc.perform(post("/api/cart/merge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
