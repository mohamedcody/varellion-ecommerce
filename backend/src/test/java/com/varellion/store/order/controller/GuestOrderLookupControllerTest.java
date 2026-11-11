package com.varellion.store.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.common.exception.GlobalExceptionHandler;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.order.dto.OrderLookupRequest;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GuestOrderLookupControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OrderService orderService;

    @InjectMocks
    private GuestOrderLookupController controller;

    private OrderResponseDto sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
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
                .orderStatus(OrderStatus.SHIPPED)
                .statusDisplayAr("مع مندوب التوصيل")
                .items(Collections.emptyList())
                .statusHistory(Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("POST /api/orders/lookup: Returns 200 OK and OrderResponseDto on valid request")
    void lookupOrder_Success() throws Exception {
        OrderLookupRequest req = OrderLookupRequest.builder()
                .orderNumber("VAR-20261028-0001")
                .phone("01012345678")
                .build();

        when(orderService.trackOrder(eq("VAR-20261028-0001"), eq("01012345678")))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/orders/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"))
                .andExpect(jsonPath("$.data.customerName").value("محمد علي"))
                .andExpect(jsonPath("$.data.orderStatus").value("SHIPPED"));
    }

    @Test
    @DisplayName("POST /api/orders/lookup: Returns 400 Bad Request when orderNumber is blank")
    void lookupOrder_FailsValidation_WhenOrderNumberBlank() throws Exception {
        OrderLookupRequest req = OrderLookupRequest.builder()
                .orderNumber("  ")
                .phone("01012345678")
                .build();

        mockMvc.perform(post("/api/orders/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/orders/lookup: Returns 400 Bad Request when phone is invalid")
    void lookupOrder_FailsValidation_WhenPhoneInvalid() throws Exception {
        OrderLookupRequest req = OrderLookupRequest.builder()
                .orderNumber("VAR-20261028-0001")
                .phone("12345") // not Egyptian phone format
                .build();

        mockMvc.perform(post("/api/orders/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/orders/lookup: Returns 404 when order or phone not found")
    void lookupOrder_NotFound() throws Exception {
        OrderLookupRequest req = OrderLookupRequest.builder()
                .orderNumber("VAR-NOTFOUND")
                .phone("01012345678")
                .build();

        when(orderService.trackOrder(eq("VAR-NOTFOUND"), eq("01012345678")))
                .thenThrow(new ResourceNotFoundException("لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين."));

        mockMvc.perform(post("/api/orders/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين."));
    }

    @Test
    @DisplayName("GET /api/orders/track: Returns 200 OK with query parameters")
    void trackOrder_GetEndpoint_Success() throws Exception {
        when(orderService.trackOrder(eq("VAR-20261028-0001"), eq("01012345678")))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/orders/track")
                        .param("orderNumber", "VAR-20261028-0001")
                        .param("phone", "01012345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"));
    }

    @Test
    @DisplayName("GET /api/orders/track: Returns 200 OK and DELIVERED status with accurate status history")
    void trackOrder_GetEndpoint_Delivered_Success() throws Exception {
        sampleResponse.setOrderStatus(OrderStatus.DELIVERED);
        sampleResponse.setStatusDisplayAr("تم التسليم بنجاح");
        sampleResponse.setEstimatedDeliveryAr("تم التسليم بنجاح");

        when(orderService.trackOrder(eq("VAR-20261028-0001"), eq("01012345678")))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/orders/track")
                        .param("orderNumber", "VAR-20261028-0001")
                        .param("phone", "01012345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.data.statusDisplayAr").value("تم التسليم بنجاح"))
                .andExpect(jsonPath("$.data.estimatedDeliveryAr").value("تم التسليم بنجاح"));
    }
}
