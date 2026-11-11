package com.varellion.store.admin.order.controller;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.admin.order.dto.PagedOrdersResponse;
import com.varellion.store.admin.order.dto.UpdateOrderStatusRequest;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.dto.OrderStatusHistoryDto;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import com.varellion.store.security.service.CustomUserDetails;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AdminOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockBean
    private OrderService orderService;

    @MockBean
    private UserRepository userRepository;

    private OrderResponseDto sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = OrderResponseDto.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("VAR-20261028-0001")
                .customerName("محمد أحمد علي")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9، مبنى 14")
                .currency("EGP")
                .subtotal(new BigDecimal("1850.00"))
                .discountTotal(BigDecimal.ZERO)
                .shippingFee(new BigDecimal("50.00"))
                .totalAmount(new BigDecimal("1900.00"))
                .orderStatus(OrderStatus.SHIPPED)
                .statusDisplayAr("مع مندوب التوصيل")
                .statusDisplayEn("Out for Delivery")
                .customerNotes("يرجى الاتصال قبل الوصول")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .statusHistory(List.of(
                        OrderStatusHistoryDto.builder()
                                .historyId(UUID.randomUUID())
                                .previousStatus(OrderStatus.CONFIRMED.name())
                                .newStatus(OrderStatus.SHIPPED.name())
                                .statusDisplayAr("مع مندوب التوصيل")
                                .statusDisplayEn("Out for Delivery")
                                .reason("تم تسليم الشحنة لشركة الشحن")
                                .createdAt(OffsetDateTime.now())
                                .build()
                ))
                .build();
    }

    @Test
    @WithMockUser(username = "admin@varellion.com", roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 200 OK, logs audit trail, and returns updated order when valid payload")
    void updateOrderStatus_Success_WhenValidPayload() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(AdminOrderController.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        logger.addAppender(listAppender);

        when(orderService.updateOrderStatus(eq("VAR-20261028-0001"), eq(OrderStatus.SHIPPED), eq("تم تسليم الشحنة لشركة الشحن"), any()))
                .thenReturn(sampleResponse);

        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("تم تسليم الشحنة لشركة الشحن")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("تم تحديث حالة الطلب بنجاح"))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"))
                .andExpect(jsonPath("$.data.orderStatus").value("SHIPPED"))
                .andExpect(jsonPath("$.data.statusDisplayAr").value("مع مندوب التوصيل"))
                .andExpect(jsonPath("$.data.statusHistory[0].newStatus").value("SHIPPED"));

        assertThat(listAppender.list).anyMatch(event ->
                event.getFormattedMessage().contains("Admin [admin@varellion.com] changed status of order [VAR-20261028-0001] to [SHIPPED] - Reason: تم تسليم الشحنة لشركة الشحن"));

        logger.detachAppender(listAppender);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 400 Bad Request when newStatus is null")
    void updateOrderStatus_ValidationError_WhenNewStatusNull() throws Exception {
        String invalidJson = "{\"newStatus\": null, \"reason\": \"Missing status\"}";

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.newStatus").value("حالة الطلب الجديدة مطلوبة"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 400 Bad Request when newStatus is invalid enum string")
    void updateOrderStatus_MalformedEnum_Returns400() throws Exception {
        String invalidEnumJson = "{\"newStatus\": \"NON_EXISTENT_STATUS\"}";

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEnumJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 400 Bad Request when reason exceeds 500 characters")
    void updateOrderStatus_ValidationError_WhenReasonTooLong() throws Exception {
        String excessiveReason = "A".repeat(501);
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.CONFIRMED)
                .reason(excessiveReason)
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.reason").value("سبب تغيير الحالة لا يمكن أن يتجاوز 500 حرف"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 404 Not Found when order does not exist")
    void updateOrderStatus_NotFound_WhenOrderDoesNotExist() throws Exception {
        String nonExistentOrder = "VAR-99999999-9999";
        when(orderService.updateOrderStatus(eq(nonExistentOrder), eq(OrderStatus.CONFIRMED), any(), any()))
                .thenThrow(new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + nonExistentOrder));

        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.CONFIRMED)
                .reason("تأكيد الطلب")
                .build();

        mockMvc.perform(put("/api/admin/orders/" + nonExistentOrder + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("لم نتمكن من العثور على الطلب رقم " + nonExistentOrder));
    }

    @Test
    @DisplayName("updateOrderStatus: Returns 401 Unauthorized when request is unauthenticated (anonymous)")
    void updateOrderStatus_Unauthorized_WhenAnonymous() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("محاولة بدون تسجيل دخول")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "customer@varellion.com", roles = "USER")
    @DisplayName("updateOrderStatus: Returns 403 Forbidden when caller lacks ROLE_ADMIN")
    void updateOrderStatus_Forbidden_WhenRoleUser() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("محاولة من مستخدم عادي")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 400 Bad Request when order number does not match pattern")
    void updateOrderStatus_ValidationError_WhenInvalidOrderNumberPattern() throws Exception {
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("رقم طلب غير صالح")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-INVALID-123/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors.orderNumber").value("صيغة رقم الطلب غير صحيحة"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("updateOrderStatus: Returns 400 Bad Request when BusinessException is thrown on invalid state transition")
    void updateOrderStatus_BadRequest_WhenBusinessExceptionOnInvalidTransition() throws Exception {
        when(orderService.updateOrderStatus(eq("VAR-20261028-0001"), eq(OrderStatus.PENDING_CUSTOMER_CONFIRMATION), any(), any()))
                .thenThrow(new BusinessException("لا يمكن تحويل حالة الطلب من 'تم تأكيد الطلب بنجاح' إلى 'تم استلام الطلب وبانتظار التأكيد'"));

        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION)
                .reason("تحويل غير منطقي")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("لا يمكن تحويل حالة الطلب من 'تم تأكيد الطلب بنجاح' إلى 'تم استلام الطلب وبانتظار التأكيد'"));
    }

    @Test
    @WithMockUser(username = "admin@varellion.com", roles = "ADMIN")
    @DisplayName("getAdminOrders: Returns 200 OK and paged list when admin calls")
    void getAdminOrders_Success_WhenAdminRole() throws Exception {
        PagedOrdersResponse pagedResponse = new PagedOrdersResponse(
                List.of(sampleResponse),
                1L,
                1,
                0,
                10
        );

        when(orderService.getAdminOrders(0, 10, null, null)).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/admin/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orders[0].orderNumber").value("VAR-20261028-0001"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    @WithMockUser(username = "user@varellion.com", roles = "USER")
    @DisplayName("getAdminOrders: Returns 403 Forbidden when caller lacks ROLE_ADMIN")
    void getAdminOrders_Forbidden_WhenNotAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@varellion.com", roles = "ADMIN")
    @DisplayName("getAdminOrderByNumber: Returns 200 OK and order details when valid orderNumber")
    void getAdminOrderByNumber_Success_WhenAdminRole() throws Exception {
        when(orderService.getAdminOrderByNumber("VAR-20261028-0001")).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/admin/orders/VAR-20261028-0001")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").value("VAR-20261028-0001"))
                .andExpect(jsonPath("$.data.orderStatus").value("SHIPPED"));
    }

    @Test
    @WithMockUser(username = "user@varellion.com", roles = "USER")
    @DisplayName("getAdminOrderByNumber: Returns 403 Forbidden when caller lacks ROLE_ADMIN")
    void getAdminOrderByNumber_Forbidden_WhenNotAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/orders/VAR-20261028-0001")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@varellion.com", roles = "ADMIN")
    @DisplayName("getAdminOrderByNumber: Returns 400 Bad Request when orderNumber format is invalid")
    void getAdminOrderByNumber_BadRequest_WhenInvalidPattern() throws Exception {
        mockMvc.perform(get("/api/admin/orders/INVALID-FORMAT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.orderNumber").value("صيغة رقم الطلب غير صحيحة"));
    }

    @Test
    @DisplayName("updateOrderStatus: Resolves authentic Long id from CustomUserDetails and forwards to OrderService")
    void updateOrderStatus_ResolvesAuthenticLongIdFromCustomUserDetails() throws Exception {
        CustomUserDetails customUser = new CustomUserDetails(
                777L,
                "superadmin@varellion.com",
                "secret",
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        when(orderService.updateOrderStatus(eq("VAR-20261028-0001"), eq(OrderStatus.SHIPPED), eq("تم تسليم الشحنة لشركة الشحن"), eq(777L)))
                .thenReturn(sampleResponse);

        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("تم تسليم الشحنة لشركة الشحن")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .with(user(customUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(orderService).updateOrderStatus("VAR-20261028-0001", OrderStatus.SHIPPED, "تم تسليم الشحنة لشركة الشحن", 777L);
    }

    @Test
    @DisplayName("updateOrderStatus: Resolves authentic Long id from UserRepository fallback when principal is standard UserDetails")
    void updateOrderStatus_ResolvesAuthenticLongIdFromUserRepositoryFallback() throws Exception {
        when(userRepository.findByUsername("admin@varellion.com"))
                .thenReturn(Optional.of(User.builder().id(888L).email("admin@varellion.com").username("admin@varellion.com").build()));

        when(orderService.updateOrderStatus(eq("VAR-20261028-0001"), eq(OrderStatus.SHIPPED), eq("تم تسليم الشحنة لشركة الشحن"), eq(888L)))
                .thenReturn(sampleResponse);

        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.builder()
                .newStatus(OrderStatus.SHIPPED)
                .reason("تم تسليم الشحنة لشركة الشحن")
                .build();

        mockMvc.perform(put("/api/admin/orders/VAR-20261028-0001/status")
                        .with(user("admin@varellion.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(orderService).updateOrderStatus("VAR-20261028-0001", OrderStatus.SHIPPED, "تم تسليم الشحنة لشركة الشحن", 888L);
    }
}
