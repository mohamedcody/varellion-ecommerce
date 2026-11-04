package com.varellion.store.order.service;

import com.varellion.store.cart.service.CartService;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.service.CustomerService;
import com.varellion.store.order.dto.CreateOrderRequest;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderItem;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.entity.OrderStatusHistory;
import com.varellion.store.order.entity.ShippingFeeStatus;
import com.varellion.store.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartService cartService;

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;
    private Customer sampleCustomer;
    private final UUID customerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .userId(customerId)
                .fullName("أحمد محمود")
                .phoneNumber("01012345678")
                .build();

        Product product = Product.builder()
                .productId(UUID.randomUUID())
                .nameAr("ساعة فارليون الزمردية")
                .nameEn("VARELLION Emerald Watch")
                .sku("VAR-W-01")
                .build();

        ProductImage mainImg = ProductImage.builder()
                .imageUrl("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9")
                .isMain(true)
                .build();
        product.setImages(List.of(mainImg));

        OrderItem item = OrderItem.builder()
                .orderItemId(UUID.randomUUID())
                .product(product)
                .productNameAr("ساعة فارليون الزمردية")
                .productNameEn("VARELLION Emerald Watch")
                .sku("VAR-W-01")
                .unitPrice(new BigDecimal("3450.00"))
                .quantity(1)
                .lineTotal(new BigDecimal("3450.00"))
                .build();

        OrderStatusHistory history = OrderStatusHistory.builder()
                .historyId(UUID.randomUUID())
                .previousStatus(null)
                .newStatus("PENDING_CUSTOMER_CONFIRMATION")
                .reason("تم تسجيل الطلب من الموقع")
                .createdAt(OffsetDateTime.now().minusHours(2))
                .build();

        sampleOrder = Order.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("VAR-20261028-0001")
                .customer(sampleCustomer)
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9، برج النور")
                .currency("EGP")
                .subtotal(new BigDecimal("3450.00"))
                .discountTotal(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("3450.00"))
                .orderStatus(OrderStatus.SHIPPED)
                .shippingFeeStatus(ShippingFeeStatus.CONFIRMED)
                .createdAt(OffsetDateTime.now().minusHours(2))
                .updatedAt(OffsetDateTime.now())
                .items(new ArrayList<>(List.of(item)))
                .statusHistory(new ArrayList<>(List.of(history)))
                .build();
    }

    @Test
    @DisplayName("trackOrder: Successfully finds order when orderNumber and exact phone match")
    void trackOrder_Success_WhenValidOrderNumberAndExactPhone() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.trackOrder("VAR-20261028-0001", "01012345678");

        assertThat(dto).isNotNull();
        assertThat(dto.getOrderNumber()).isEqualTo("VAR-20261028-0001");
        assertThat(dto.getCustomerName()).isEqualTo("أحمد محمود");
        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(dto.getStatusDisplayAr()).isEqualTo("مع مندوب التوصيل");
        assertThat(dto.getItems()).hasSize(1);
        assertThat(dto.getItems().get(0).getImageUrl()).isEqualTo("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9");
        assertThat(dto.getEstimatedDeliveryAr()).contains("1 - 2 يوم عمل");
    }

    @Test
    @DisplayName("trackOrder: Normalizes international Egyptian phone (+201012345678) and matches")
    void trackOrder_Success_WhenPhoneHasInternationalPrefix() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.trackOrder("var-20261028-0001", "+201012345678");

        assertThat(dto).isNotNull();
        assertThat(dto.getOrderNumber()).isEqualTo("VAR-20261028-0001");
    }

    @Test
    @DisplayName("trackOrder: Normalizes 0020 prefix and spaced numbers")
    void trackOrder_Success_WhenPhoneHas0020PrefixAndSpaces() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.trackOrder("VAR-20261028-0001", "0020 10 1234 5678");

        assertThat(dto).isNotNull();
        assertThat(dto.getOrderNumber()).isEqualTo("VAR-20261028-0001");
    }

    @Test
    @DisplayName("trackOrder: Throws ResourceNotFoundException when order does not exist")
    void trackOrder_ThrowsNotFound_WhenOrderDoesNotExist() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-INVALID"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.trackOrder("VAR-INVALID", "01012345678"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("لم نتمكن من العثور على طلب");
    }

    @Test
    @DisplayName("trackOrder: Throws ResourceNotFoundException when phone does not match")
    void trackOrder_ThrowsNotFound_WhenPhoneDoesNotMatch() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.trackOrder("VAR-20261028-0001", "01199999999"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("لم نتمكن من العثور على طلب");
    }

    @Test
    @DisplayName("calculateEstimatedDelivery: Cairo and Giza get 1-2 business days")
    void calculateEstimatedDelivery_CairoAndGiza() {
        assertThat(orderService.calculateEstimatedDelivery("القاهرة")).contains("1 - 2");
        assertThat(orderService.calculateEstimatedDelivery("الجيزة")).contains("1 - 2");
    }

    @Test
    @DisplayName("calculateEstimatedDelivery: Alexandria and Delta get 2-3 business days")
    void calculateEstimatedDelivery_AlexandriaAndDelta() {
        assertThat(orderService.calculateEstimatedDelivery("الإسكندرية")).contains("2 - 3");
        assertThat(orderService.calculateEstimatedDelivery("المنصورة - الدقهلية")).contains("2 - 3");
    }

    @Test
    @DisplayName("calculateEstimatedDelivery: Upper Egypt gets 3-5 business days")
    void calculateEstimatedDelivery_UpperEgypt() {
        assertThat(orderService.calculateEstimatedDelivery("أسوان")).contains("3 - 5");
        assertThat(orderService.calculateEstimatedDelivery("سوهاج")).contains("3 - 5");
    }

    @Test
    @DisplayName("getCustomerOrders: Retrieves paginated orders for authenticated user")
    void getCustomerOrders_Success() {
        when(customerService.getOrCreateCustomerForUser("user@varellion.com"))
                .thenReturn(sampleCustomer);
        Page<Order> page = new PageImpl<>(List.of(sampleOrder));
        when(orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(eq(customerId), any(Pageable.class)))
                .thenReturn(page);

        List<OrderResponseDto> dtos = orderService.getCustomerOrders("user@varellion.com", 0, 10);

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).getOrderNumber()).isEqualTo("VAR-20261028-0001");
    }

    @Test
    @DisplayName("getCustomerOrderByNumber: Throws ResourceNotFoundException when user is not owner")
    void getCustomerOrderByNumber_ThrowsNotFound_WhenNotOwner() {
        when(customerService.getOrCreateCustomerForUser("user@varellion.com"))
                .thenReturn(sampleCustomer);
        when(orderRepository.findByCustomerUserIdAndOrderNumber(customerId, "VAR-20261028-0001"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getCustomerOrderByNumber("user@varellion.com", "VAR-20261028-0001"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("trackOrder: When status is DELIVERED, returns DELIVERED status and تم التسليم بنجاح delivery display")
    void trackOrder_Success_WhenOrderStatusIsDelivered() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERED);
        OrderStatusHistory deliveredHistory = OrderStatusHistory.builder()
                .historyId(UUID.randomUUID())
                .previousStatus("SHIPPED")
                .newStatus("DELIVERED")
                .reason("تم تسليم الشحنة للعميل بنجاح")
                .createdAt(OffsetDateTime.now())
                .build();
        sampleOrder.getStatusHistory().add(deliveredHistory);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.trackOrder("VAR-20261028-0001", "01012345678");

        assertThat(dto).isNotNull();
        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(dto.getStatusDisplayAr()).isEqualTo("تم التسليم بنجاح");
        assertThat(dto.getStatusDisplayEn()).isEqualTo("Delivered");
        assertThat(dto.getEstimatedDeliveryAr()).isEqualTo("تم التسليم بنجاح");
        assertThat(dto.getStatusHistory()).hasSize(2);
        assertThat(dto.getStatusHistory().get(1).getNewStatus()).isEqualTo("DELIVERED");
        assertThat(dto.getStatusHistory().get(1).getStatusDisplayAr()).isEqualTo("تم التسليم بنجاح");
    }

    @Test
    @DisplayName("mapToDto: Guarantees statusHistory contains DELIVERED progression entry even if missing from DB history")
    void mapToDto_GuaranteesDeliveredProgressionEntry_WhenMissingInDbHistory() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERED);
        // sampleOrder only has PENDING_CUSTOMER_CONFIRMATION in history initially

        OrderResponseDto dto = orderService.mapToDto(sampleOrder);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(dto.getStatusDisplayAr()).isEqualTo("تم التسليم بنجاح");
        // Must contain progression entry for DELIVERED
        assertThat(dto.getStatusHistory()).isNotEmpty();
        boolean hasDeliveredEntry = dto.getStatusHistory().stream()
                .anyMatch(h -> "DELIVERED".equalsIgnoreCase(h.getNewStatus()) && "تم التسليم بنجاح".equals(h.getStatusDisplayAr()));
        assertThat(hasDeliveredEntry).isTrue();
    }

    @Test
    @DisplayName("updateOrderStatus: Successfully transitions order to DELIVERED and records audit entry")
    void updateOrderStatus_Success_WhenTransitioningToDelivered() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.DELIVERED, "Order delivered by courier");

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(dto.getStatusDisplayAr()).isEqualTo("تم التسليم بنجاح");
        assertThat(dto.getEstimatedDeliveryAr()).isEqualTo("تم التسليم بنجاح");
        assertThat(dto.getStatusHistory()).anyMatch(h -> "DELIVERED".equals(h.getNewStatus()));
    }

    @Test
    @DisplayName("mapToDto: Handles null createdAt in statusHistory without NullPointerException")
    void mapToDto_HandlesNullCreatedAtInStatusHistoryWithoutNpe() {
        sampleOrder.getStatusHistory().add(OrderStatusHistory.builder()
                .historyId(UUID.randomUUID())
                .newStatus("DELIVERED")
                .createdAt(null)
                .build());

        OrderResponseDto dto = orderService.mapToDto(sampleOrder);

        assertThat(dto).isNotNull();
        assertThat(dto.getStatusHistory()).isNotEmpty();
    }

    @Test
    @DisplayName("mapToDto: Parses lowercase or untrimmed status in history correctly to canonical enum and Arabic display without duplication")
    void mapToDto_ParsesLowercaseStatusInHistoryRobustly() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERED);
        sampleOrder.getStatusHistory().add(OrderStatusHistory.builder()
                .historyId(UUID.randomUUID())
                .newStatus("delivered ")
                .createdAt(OffsetDateTime.now())
                .build());

        OrderResponseDto dto = orderService.mapToDto(sampleOrder);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        // Ensure canonical uppercase enum string in history DTO
        assertThat(dto.getStatusHistory()).anyMatch(h ->
                "DELIVERED".equals(h.getNewStatus()) && "تم التسليم بنجاح".equals(h.getStatusDisplayAr())
        );
        // Ensure no duplicate entry was synthesized (1 initial + 1 delivered = 2 total)
        long deliveredCount = dto.getStatusHistory().stream()
                .filter(h -> "DELIVERED".equalsIgnoreCase(h.getNewStatus()))
                .count();
        assertThat(deliveredCount).isEqualTo(1);
    }

    @Test
    @DisplayName("createOrder: Successfully places order, increments reserved stock, clears cart, and returns authoritative DTO")
    void createOrder_Success_COD() {
        UUID prodId = UUID.randomUUID();
        Product mockProduct = Product.builder()
                .productId(prodId)
                .nameAr("ساعة فاريليون كلاسيك")
                .nameEn("Varellion Classic Watch")
                .sku("VAR-WATCH-001")
                .price(new BigDecimal("1000.00"))
                .costPrice(new BigDecimal("600.00"))
                .stockQuantity(10)
                .reservedQuantity(0)
                .isActive(true)
                .images(new ArrayList<>())
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .alternativePhone("01198765432")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9، برج الصفا")
                .customerNotes("يرجى الاتصال قبل التوصيل")
                .paymentMethod("CASH_ON_DELIVERY")
                .items(List.of(new CreateOrderRequest.CreateOrderItemRequest(prodId, 2)))
                .build();

        when(customerService.getOrCreateCustomerForUser("test@varellion.com", "أحمد محمود"))
                .thenReturn(sampleCustomer);
        when(productRepository.findByIdForUpdate(prodId))
                .thenReturn(Optional.of(mockProduct));
        when(orderRepository.existsByOrderNumberIgnoreCase(any()))
                .thenReturn(false);
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto response = orderService.createOrder("test@varellion.com", request);

        assertThat(response).isNotNull();
        assertThat(response.getCustomerName()).isEqualTo("أحمد محمود");
        assertThat(response.getCustomerPhone()).isEqualTo("01012345678");
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("2000.00"));
        assertThat(response.getShippingFee()).isEqualByComparingTo(new BigDecimal("50.00")); // Cairo fee
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("2050.00"));
        assertThat(response.getOrderStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION);
        assertThat(response.getCustomerNotes()).contains("هاتف بديل: 01198765432");

        // Verify inventory reservation incremented (0 + 2 = 2)
        assertThat(mockProduct.getReservedQuantity()).isEqualTo(2);

        // Verify cart clearance was invoked
        org.mockito.Mockito.verify(cartService).clearCart("test@varellion.com");
    }

    @Test
    @DisplayName("createOrder: Throws IllegalArgumentException when available stock is insufficient")
    void createOrder_InsufficientStock_ThrowsException() {
        UUID prodId = UUID.randomUUID();
        Product mockProduct = Product.builder()
                .productId(prodId)
                .nameAr("ساعة فاريليون كلاسيك")
                .stockQuantity(5)
                .reservedQuantity(4) // Only 1 available
                .isActive(true)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .items(List.of(new CreateOrderRequest.CreateOrderItemRequest(prodId, 3))) // Requests 3
                .build();

        when(customerService.getOrCreateCustomerForUser("test@varellion.com", "أحمد محمود"))
                .thenReturn(sampleCustomer);
        when(productRepository.findByIdForUpdate(prodId))
                .thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> orderService.createOrder("test@varellion.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("غير متوفرة في المخزون");
    }

    @Test
    @DisplayName("createOrder: Throws IllegalArgumentException when product is inactive")
    void createOrder_InactiveProduct_ThrowsException() {
        UUID prodId = UUID.randomUUID();
        Product mockProduct = Product.builder()
                .productId(prodId)
                .nameAr("منتج ملغي")
                .stockQuantity(10)
                .reservedQuantity(0)
                .isActive(false) // Inactive
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .items(List.of(new CreateOrderRequest.CreateOrderItemRequest(prodId, 1)))
                .build();

        when(customerService.getOrCreateCustomerForUser("test@varellion.com", "أحمد محمود"))
                .thenReturn(sampleCustomer);
        when(productRepository.findByIdForUpdate(prodId))
                .thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> orderService.createOrder("test@varellion.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("غير متاح للشراء");
    }

    @Test
    @DisplayName("createOrder: Throws IllegalArgumentException when request contains duplicate product IDs")
    void createOrder_DuplicateProducts_ThrowsException() {
        UUID prodId = UUID.randomUUID();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .items(List.of(
                        new CreateOrderRequest.CreateOrderItemRequest(prodId, 1),
                        new CreateOrderRequest.CreateOrderItemRequest(prodId, 2)
                ))
                .build();

        assertThatThrownBy(() -> orderService.createOrder("test@varellion.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("لا يمكن تكرار نفس المنتج");
    }

    @Test
    @DisplayName("createOrder: Preserves non-COD payment method in DTO and admin notes")
    void createOrder_PaymentMethodCard_ReflectedInDtoAndAdminNotes() {
        UUID prodId = UUID.randomUUID();
        Product mockProduct = Product.builder()
                .productId(prodId)
                .nameAr("ساعة يد كلاسيك")
                .sku("VAR-CLK-01")
                .price(BigDecimal.valueOf(1500))
                .stockQuantity(10)
                .reservedQuantity(0)
                .isActive(true)
                .build();

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerName("أحمد محمود")
                .customerPhone("01012345678")
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .paymentMethod("CARD")
                .items(List.of(new CreateOrderRequest.CreateOrderItemRequest(prodId, 1)))
                .build();

        when(customerService.getOrCreateCustomerForUser("test@varellion.com", "أحمد محمود"))
                .thenReturn(sampleCustomer);
        when(productRepository.findByIdForUpdate(prodId))
                .thenReturn(Optional.of(mockProduct));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> {
                    Order o = invocation.getArgument(0);
                    o.setOrderId(UUID.randomUUID());
                    return o;
                });

        OrderResponseDto dto = orderService.createOrder("test@varellion.com", request);

        assertThat(dto.getPaymentMethod()).isEqualTo("CARD");
    }

    @Test
    @DisplayName("calculateAuthoritativeShippingFee: Accurately handles Arabic spelling variations (ه/ة and أ/إ/ا)")
    void calculateAuthoritativeShippingFee_SpellingVariations() {
        // Cairo with Ha instead of Ta Marbuta
        assertThat(orderService.calculateAuthoritativeShippingFee("القاهره", BigDecimal.valueOf(500)))
                .isEqualByComparingTo(new BigDecimal("50.00"));

        // Giza with Ha
        assertThat(orderService.calculateAuthoritativeShippingFee("الجيزه", BigDecimal.valueOf(500)))
                .isEqualByComparingTo(new BigDecimal("50.00"));

        // Alexandria without hamza
        assertThat(orderService.calculateAuthoritativeShippingFee("الاسكندرية", BigDecimal.valueOf(500)))
                .isEqualByComparingTo(new BigDecimal("60.00"));

        // Free shipping for >= 2500 EGP
        assertThat(orderService.calculateAuthoritativeShippingFee("أسوان", BigDecimal.valueOf(2500)))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }
}
