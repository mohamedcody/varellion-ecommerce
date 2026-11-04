package com.varellion.store.order.controller;

import com.varellion.store.common.exception.GlobalExceptionHandler;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.http.MediaType;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private OrderResponseDto sampleResponse;
    private final UserDetails mockUserDetails = User.builder()
            .username("customer@varellion.com")
            .password("password")
            .authorities("ROLE_USER")
            .build();

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

        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = OrderResponseDto.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("VAR-20261028-0001")
                .customerName("محمد علي")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .currency("EGP")
                .subtotal(new BigDecimal("3450.00"))
                .discountTotal(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("3450.00"))
                .orderStatus(OrderStatus.CONFIRMED)
                .statusDisplayAr("تم تأكيد الطلب بنجاح")
                .items(Collections.emptyList())
                .statusHistory(Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("GET /api/orders/my-orders: Returns customer order list")
    void getMyOrders_Success() throws Exception {
        when(orderService.getCustomerOrders(eq("customer@varellion.com"), eq(0), eq(10)))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/orders/my-orders")
                        .param("page", "0")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].orderNumber").value("VAR-20261028-0001"));
    }

    @Test
    @DisplayName("GET /api/orders/{orderNumber}: Returns single customer order")
    void getOrderByNumber_Success() throws Exception {
        when(orderService.getCustomerOrderByNumber(eq("customer@varellion.com"), eq("VAR-20261028-0001")))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/orders/VAR-20261028-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"));
    }

    @Test
    @DisplayName("GET /api/orders/{orderNumber}: Returns 404 when order not found or not owner")
    void getOrderByNumber_NotFound() throws Exception {
        when(orderService.getCustomerOrderByNumber(eq("customer@varellion.com"), eq("VAR-UNKNOWN")))
                .thenThrow(new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم VAR-UNKNOWN"));

        mockMvc.perform(get("/api/orders/VAR-UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("لم نتمكن من العثور على الطلب رقم VAR-UNKNOWN"));
    }

    @Test
    @DisplayName("GET /api/orders/{orderNumber}: Returns DELIVERED status and تم التسليم بنجاح for authenticated customer")
    void getOrderByNumber_Delivered_Success() throws Exception {
        sampleResponse.setOrderStatus(OrderStatus.DELIVERED);
        sampleResponse.setStatusDisplayAr("تم التسليم بنجاح");

        when(orderService.getCustomerOrderByNumber(eq("customer@varellion.com"), eq("VAR-20261028-0001")))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/orders/VAR-20261028-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.data.statusDisplayAr").value("تم التسليم بنجاح"));
    }

    @Test
    @DisplayName("POST /api/orders: Authenticated customer creates order successfully and receives 201 Created")
    void createOrder_Authenticated_Returns201() throws Exception {
        UUID prodId = UUID.randomUUID();
        String jsonPayload = """
            {
              "customerName": "أحمد محمود",
              "customerPhone": "01012345678",
              "shippingGovernorate": "القاهرة",
              "shippingCityArea": "المعادي",
              "shippingDetailedAddress": "شارع 9، برج الصفا",
              "paymentMethod": "CASH_ON_DELIVERY",
              "items": [
                {
                  "productId": "%s",
                  "quantity": 1
                }
              ]
            }
        """.formatted(prodId);

        when(orderService.createOrder(eq("customer@varellion.com"), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("تم تأكيد وتسجيل طلبك بنجاح"))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"));
    }

    @Test
    @DisplayName("POST /api/orders: Returns 400 Bad Request when customer phone is blank")
    void createOrder_InvalidPayload_Returns400() throws Exception {
        UUID prodId = UUID.randomUUID();
        String invalidPayload = """
            {
              "customerName": "أحمد محمود",
              "customerPhone": "",
              "shippingGovernorate": "القاهرة",
              "shippingCityArea": "المعادي",
              "shippingDetailedAddress": "شارع 9",
              "items": [
                {
                  "productId": "%s",
                  "quantity": 1
                }
              ]
            }
        """.formatted(prodId);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.customerPhone").value("رقم الهاتف مطلوب"));
    }
}
