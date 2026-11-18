package com.varellion.store.order.service;

import com.varellion.store.admin.order.dto.OrderStatusCountDto;
import com.varellion.store.admin.order.dto.UpdateDeliveryAddressRequest;
import com.varellion.store.cart.service.CartService;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.BusinessException;
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
import org.mockito.InOrder;
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
import static org.mockito.Mockito.*;

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
    @DisplayName("updateOrderStatus: Saves actorId in OrderStatusHistory when provided")
    void updateOrderStatus_SavesActorIdInHistory() {
        Long actorId = 100L;
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.DELIVERED,
                "Delivered by courier",
                actorId
        );

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        verify(orderRepository).save(any(Order.class));
        assertThat(sampleOrder.getStatusHistory()).anyMatch(h ->
                "DELIVERED".equals(h.getNewStatus()) && actorId.equals(h.getActorId()));
    }

    @Test
    @DisplayName("updateOrderStatus: Three-arg backward-compatible overload delegates with null actorId")
    void updateOrderStatus_ThreeArgOverload_DelegatesWithNullActorId() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.DELIVERED,
                "Delivered by courier"
        );

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        verify(orderRepository).save(any(Order.class));
        assertThat(sampleOrder.getStatusHistory()).anyMatch(h ->
                "DELIVERED".equals(h.getNewStatus()) && h.getActorId() == null);
    }

    @Test
    @DisplayName("updateOrderStatus: Releases reserved stock when transitioning to CANCELLED")
    void updateOrderStatus_ReleasesReservedStock_WhenTransitioningToCancelled() {
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(10);
        product.setReservedQuantity(2);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(product.getProductId()))
                .thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.CANCELLED, "Customer requested cancellation");

        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("updateOrderStatus: Releases reserved stock when transitioning to EXPIRED")
    void updateOrderStatus_ReleasesReservedStock_WhenTransitioningToExpired() {
        sampleOrder.setOrderStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(10);
        product.setReservedQuantity(3);
        sampleOrder.getItems().get(0).setQuantity(3);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(product.getProductId()))
                .thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.EXPIRED, "Confirmation deadline passed");

        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("updateOrderStatus: Deducts physical and reserved stock when transitioning to SHIPPED")
    void updateOrderStatus_DeductsPhysicalAndReservedStock_WhenTransitioningToShipped() {
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(10);
        product.setReservedQuantity(2);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(product.getProductId()))
                .thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.SHIPPED, "Order dispatched with courier");

        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("updateOrderStatus: Does not double deduct physical stock when transitioning from SHIPPED to DELIVERED")
    void updateOrderStatus_DoesNotDoubleDeduct_WhenTransitioningFromShippedToDelivered() {
        sampleOrder.setOrderStatus(OrderStatus.SHIPPED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(0);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.DELIVERED, "Order delivered");

        assertThat(product.getStockQuantity()).isEqualTo(8);
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("updateOrderStatus: Returns immediately without saving duplicate history when status is unchanged")
    void updateOrderStatus_Idempotent_WhenSameStatus() {
        // sampleOrder is currently in SHIPPED status
        int initialHistorySize = sampleOrder.getStatusHistory().size();
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.SHIPPED,
                "Redundant update",
                100L
        );

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(sampleOrder.getStatusHistory()).hasSize(initialHistorySize);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus: Throws BusinessException (400) when transitioning from terminal state DELIVERED")
    void updateOrderStatus_ThrowsBusinessException_WhenTerminalState() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERED);
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.CANCELLED,
                "Cannot cancel delivered order",
                100L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("لا يمكن تحويل حالة الطلب");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus: Throws BusinessException (400) on illogical backward transition")
    void updateOrderStatus_ThrowsBusinessException_WhenIllogicalBackwardTransition() {
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.updateOrderStatus(
                "VAR-20261028-0001",
                OrderStatus.PENDING_CUSTOMER_CONFIRMATION,
                "Cannot revert to pending",
                100L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("لا يمكن تحويل حالة الطلب");

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("updateOrderStatus: Acquires pessimistic locks in strict ascending order of productId regardless of item order")
    void updateOrderStatus_AcquiresPessimisticLocksInAscendingProductIdOrder() {
        List<UUID> uuids = new ArrayList<>(List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));
        uuids.sort(UUID::compareTo);
        UUID u1 = uuids.get(0);
        UUID u2 = uuids.get(1);
        UUID u3 = uuids.get(2);

        Product p1 = Product.builder().productId(u1).nameAr("P1").stockQuantity(10).reservedQuantity(2).build();
        Product p2 = Product.builder().productId(u2).nameAr("P2").stockQuantity(10).reservedQuantity(2).build();
        Product p3 = Product.builder().productId(u3).nameAr("P3").stockQuantity(10).reservedQuantity(2).build();

        // Place items in reverse / scrambled order: p3, p1, p2
        OrderItem item3 = OrderItem.builder().orderItemId(UUID.randomUUID()).product(p3).quantity(1).build();
        OrderItem item1 = OrderItem.builder().orderItemId(UUID.randomUUID()).product(p1).quantity(1).build();
        OrderItem item2 = OrderItem.builder().orderItemId(UUID.randomUUID()).product(p2).quantity(1).build();

        sampleOrder.setItems(new ArrayList<>(List.of(item3, item1, item2)));
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(u1)).thenReturn(Optional.of(p1));
        when(productRepository.findByIdForUpdate(u2)).thenReturn(Optional.of(p2));
        when(productRepository.findByIdForUpdate(u3)).thenReturn(Optional.of(p3));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.SHIPPED, "Order dispatched", 100L);

        // Verify that locks were acquired in strictly ascending order: u1, u2, u3
        InOrder inOrder = inOrder(productRepository);
        inOrder.verify(productRepository).findByIdForUpdate(u1);
        inOrder.verify(productRepository).findByIdForUpdate(u2);
        inOrder.verify(productRepository).findByIdForUpdate(u3);

        assertThat(p1.getStockQuantity()).isEqualTo(9);
        assertThat(p1.getReservedQuantity()).isEqualTo(1);
        assertThat(p2.getStockQuantity()).isEqualTo(9);
        assertThat(p2.getReservedQuantity()).isEqualTo(1);
        assertThat(p3.getStockQuantity()).isEqualTo(9);
        assertThat(p3.getReservedQuantity()).isEqualTo(1);
    }

    @Test
    @DisplayName("updateOrderStatus: Deduplicates locks and aggregates quantities when order items contain duplicate products")
    void updateOrderStatus_DeduplicatesLocksAndAggregatesQuantities_WhenDuplicateProductsInOrder() {
        UUID prodId = UUID.randomUUID();
        Product product = Product.builder().productId(prodId).nameAr("P1").stockQuantity(20).reservedQuantity(10).build();

        // Two order items referencing the same product: qty 2 and qty 3
        OrderItem itemA = OrderItem.builder().orderItemId(UUID.randomUUID()).product(product).quantity(2).build();
        OrderItem itemB = OrderItem.builder().orderItemId(UUID.randomUUID()).product(product).quantity(3).build();

        sampleOrder.setItems(new ArrayList<>(List.of(itemA, itemB)));
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(prodId)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.SHIPPED, "Dispatched");

        // Lock must be requested exactly once for prodId
        verify(productRepository, times(1)).findByIdForUpdate(prodId);
        verify(productRepository, times(1)).save(product);

        // Total quantity 5 (2 + 3) deducted from stock (20 - 5 = 15) and reserved (10 - 5 = 5)
        assertThat(product.getStockQuantity()).isEqualTo(15);
        assertThat(product.getReservedQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("updateOrderStatus: Releases reserved stock with sorted locks when transitioning to CANCELLED")
    void updateOrderStatus_ReleasesReservedStock_WithSortedLocks_WhenCancelled() {
        List<UUID> uuids = new ArrayList<>(List.of(UUID.randomUUID(), UUID.randomUUID()));
        uuids.sort(UUID::compareTo);
        UUID u1 = uuids.get(0);
        UUID u2 = uuids.get(1);

        Product p1 = Product.builder().productId(u1).nameAr("P1").stockQuantity(10).reservedQuantity(4).build();
        Product p2 = Product.builder().productId(u2).nameAr("P2").stockQuantity(10).reservedQuantity(6).build();

        // Scrambled: p2 before p1
        OrderItem item2 = OrderItem.builder().orderItemId(UUID.randomUUID()).product(p2).quantity(2).build();
        OrderItem item1 = OrderItem.builder().orderItemId(UUID.randomUUID()).product(p1).quantity(3).build();

        sampleOrder.setItems(new ArrayList<>(List.of(item2, item1)));
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(u1)).thenReturn(Optional.of(p1));
        when(productRepository.findByIdForUpdate(u2)).thenReturn(Optional.of(p2));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.CANCELLED, "Customer cancellation");

        InOrder inOrder = inOrder(productRepository);
        inOrder.verify(productRepository).findByIdForUpdate(u1);
        inOrder.verify(productRepository).findByIdForUpdate(u2);

        // Physical stock untouched
        assertThat(p1.getStockQuantity()).isEqualTo(10);
        assertThat(p1.getReservedQuantity()).isEqualTo(1); // 4 - 3 = 1
        assertThat(p2.getStockQuantity()).isEqualTo(10);
        assertThat(p2.getReservedQuantity()).isEqualTo(4); // 6 - 2 = 4
    }

    @Test
    @DisplayName("updateOrderStatus: Handles non-existent product gracefully using item product fallback")
    void updateOrderStatus_HandlesNonExistentProductGracefully() {
        UUID prodId = UUID.randomUUID();
        Product product = Product.builder().productId(prodId).nameAr("Ghost Product").stockQuantity(5).reservedQuantity(2).build();
        OrderItem item = OrderItem.builder().orderItemId(UUID.randomUUID()).product(product).quantity(2).build();

        sampleOrder.setItems(new ArrayList<>(List.of(item)));
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(prodId)).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus("VAR-20261028-0001", OrderStatus.CANCELLED, "Cancelled ghost product order");

        assertThat(dto).isNotNull();
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository).save(product);
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

    @Test
    @DisplayName("updateAdminNotes: Updates notes on order and returns updated DTO")
    void updateAdminNotes_Success() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261109-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponseDto updated = orderService.updateAdminNotes("VAR-20261109-0001", "تم التأكيد هاتفياً مع العميل");

        assertThat(sampleOrder.getAdminNotes()).isEqualTo("تم التأكيد هاتفياً مع العميل");
    }

    @Test
    @DisplayName("updateOrderDeliveryAddress: Successfully updates address and recalculates shipping fee when governorate changes")
    void updateOrderDeliveryAddress_Success() {
        sampleOrder.setOrderStatus(OrderStatus.CONFIRMED);
        sampleOrder.setShippingGovernorate("القاهرة");
        sampleOrder.setSubtotal(new BigDecimal("1000.00"));
        sampleOrder.setDiscountTotal(BigDecimal.ZERO);
        sampleOrder.setShippingFee(new BigDecimal("50.00"));
        sampleOrder.setTotalAmount(new BigDecimal("1050.00"));

        UpdateDeliveryAddressRequest req = UpdateDeliveryAddressRequest.builder()
                .shippingGovernorate("أسوان")
                .shippingCityArea("مدينة أسوان")
                .shippingDetailedAddress("شارع الكورنيش")
                .customerPhone("01011112222")
                .customerName("محمد الأسواني")
                .build();

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261109-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponseDto updated = orderService.updateOrderDeliveryAddress("VAR-20261109-0001", req);

        assertThat(updated.getShippingGovernorate()).isEqualTo("أسوان");
        assertThat(updated.getShippingFee()).isEqualByComparingTo("85.00"); // Aswan rate
        assertThat(updated.getTotalAmount()).isEqualByComparingTo("1085.00");
    }

    @Test
    @DisplayName("updateOrderDeliveryAddress: Throws BusinessException when order is already SHIPPED")
    void updateOrderDeliveryAddress_RejectsWhenShipped() {
        sampleOrder.setOrderStatus(OrderStatus.SHIPPED);

        UpdateDeliveryAddressRequest req = UpdateDeliveryAddressRequest.builder()
                .shippingGovernorate("الإسكندرية")
                .shippingCityArea("سموحة")
                .shippingDetailedAddress("شارع فوزي معاذ")
                .build();

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261109-0001"))
                .thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> orderService.updateOrderDeliveryAddress("VAR-20261109-0001", req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("لا يمكن تعديل عنوان الشحن لطلب في حالة");
    }

    @Test
    @DisplayName("getOrderStatusStatistics: Returns aggregated order counts breakdown")
    void getOrderStatusStatistics_Success() {
        List<Object[]> rows = List.<Object[]>of(
                new Object[]{OrderStatus.CONFIRMED, 5L},
                new Object[]{OrderStatus.DELIVERED, 10L}
        );
        when(orderRepository.countOrdersGroupByStatus()).thenReturn(rows);

        OrderStatusCountDto stats = orderService.getOrderStatusStatistics();

        assertThat(stats).isNotNull();
        assertThat(stats.getAllOrders()).isEqualTo(15L);
        assertThat(stats.getConfirmed()).isEqualTo(5L);
        assertThat(stats.getDelivered()).isEqualTo(10L);
    }

    @Test
    @DisplayName("SEC-INV-01: Pre-shipment cancellation from PREPARING releases reserved stock only without changing physical stock")
    void updateOrderStatus_PreShipmentCancelFromPreparing_ReleasesReservedOnly() {
        sampleOrder.setOrderStatus(OrderStatus.PREPARING);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(10);
        product.setReservedQuantity(2);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(productRepository.findByIdForUpdate(product.getProductId()))
                .thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.CANCELLED, "Cancelled before dispatch", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getStockQuantity()).isEqualTo(10);
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("SEC-INV-01: SHIPPED -> DELIVERY_FAILED does not restore physical or reserved stock")
    void updateOrderStatus_ShippedToDeliveryFailed_DoesNotMutateInventory() {
        sampleOrder.setOrderStatus(OrderStatus.SHIPPED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(0);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.DELIVERY_FAILED, "Customer unreachable", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.DELIVERY_FAILED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: SHIPPED -> RETURNED does not automatically add stock without physical warehouse receipt")
    void updateOrderStatus_ShippedToReturned_DoesNotAutoRestoreStock() {
        sampleOrder.setOrderStatus(OrderStatus.SHIPPED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(0);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.RETURNED, "Courier marked parcel returned", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.RETURNED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: DELIVERY_FAILED -> RETURNED does not automatically add stock without physical warehouse receipt")
    void updateOrderStatus_DeliveryFailedToReturned_DoesNotAutoRestoreStock() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERY_FAILED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(0);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.RETURNED, "Returned after failed delivery attempts", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.RETURNED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(0);
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: SHIPPED -> CANCELLED does not restore physical stock or touch reserved stock")
    void updateOrderStatus_ShippedToCancelled_DoesNotAutoRestoreStock() {
        sampleOrder.setOrderStatus(OrderStatus.SHIPPED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(1); // reservation belongs to another active order
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.CANCELLED, "Cancelled while in transit", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(1);
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: DELIVERY_FAILED -> CANCELLED does not restore physical stock or touch other reservations")
    void updateOrderStatus_DeliveryFailedToCancelled_DoesNotAutoRestoreStock() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERY_FAILED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(1);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.CANCELLED, "Cancelled after delivery failure", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(1);
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: DELIVERY_FAILED -> SHIPPED and DELIVERY_FAILED -> DELIVERED do not double-deduct stock")
    void updateOrderStatus_DeliveryFailedRedeliveryAndDelivery_DoesNotDoubleDeductStock() {
        sampleOrder.setOrderStatus(OrderStatus.DELIVERY_FAILED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(1);
        sampleOrder.getItems().get(0).setQuantity(2);

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto redelivered = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.SHIPPED, "Second delivery attempt", 10L);
        assertThat(redelivered.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(1);

        sampleOrder.setOrderStatus(OrderStatus.DELIVERY_FAILED);
        OrderResponseDto delivered = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.DELIVERED, "Delivered on retry", 10L);
        assertThat(delivered.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(product.getReservedQuantity()).isEqualTo(1);

        verify(productRepository, never()).findByIdForUpdate(any());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("SEC-INV-01: Repeated transition to RETURNED is idempotent and does not mutate inventory or history")
    void updateOrderStatus_RepeatedReturned_IsIdempotent() {
        sampleOrder.setOrderStatus(OrderStatus.RETURNED);
        Product product = sampleOrder.getItems().get(0).getProduct();
        product.setStockQuantity(8);
        product.setReservedQuantity(0);
        int initialHistorySize = sampleOrder.getStatusHistory().size();

        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        OrderResponseDto dto = orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.RETURNED, "Duplicate return event", 10L);

        assertThat(dto.getOrderStatus()).isEqualTo(OrderStatus.RETURNED);
        assertThat(product.getStockQuantity()).isEqualTo(8);
        assertThat(sampleOrder.getStatusHistory()).hasSize(initialHistorySize);
        verify(productRepository, never()).save(any(Product.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("SEC-INV-01: Terminal states RETURNED and CANCELLED reject subsequent transitions")
    void updateOrderStatus_TerminalReturnedAndCancelled_RejectTransitions() {
        when(orderRepository.findByOrderNumberWithDetails("VAR-20261028-0001"))
                .thenReturn(Optional.of(sampleOrder));

        sampleOrder.setOrderStatus(OrderStatus.RETURNED);
        assertThatThrownBy(() -> orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.SHIPPED, "Invalid retry", 10L))
                .isInstanceOf(BusinessException.class);

        sampleOrder.setOrderStatus(OrderStatus.CANCELLED);
        assertThatThrownBy(() -> orderService.updateOrderStatus(
                "VAR-20261028-0001", OrderStatus.CONFIRMED, "Invalid reopen", 10L))
                .isInstanceOf(BusinessException.class);

        verify(productRepository, never()).save(any(Product.class));
        verify(orderRepository, never()).save(any(Order.class));
    }
}
