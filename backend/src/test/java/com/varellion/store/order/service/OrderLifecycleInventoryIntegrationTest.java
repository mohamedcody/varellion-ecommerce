package com.varellion.store.order.service;

import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.dto.CreateOrderRequest;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.entity.OrderStatusHistory;
import com.varellion.store.order.repository.OrderRepository;
import com.varellion.store.order.repository.OrderStatusHistoryRepository;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class OrderLifecycleInventoryIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private User createRegisteredUser(String prefix, String role) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .email(prefix + "-" + suffix + "@varellion-test.local")
                .username(prefix + "_" + suffix)
                .password("$2a$10$dummyhashedpasswordfortests0000000000000000000000")
                .role(role)
                .enabled(true)
                .emailVerified(true)
                .build();
        return userRepository.save(user);
    }

    private Customer preProvisionCustomer(User user, String fullName, String phone) {
        Customer customer = Customer.builder()
                .userId(UUID.randomUUID())
                .userAccountId(user.getId())
                .fullName(fullName)
                .phoneNumber(phone)
                .isActive(true)
                .build();
        return customerRepository.save(customer);
    }

    private Product createProduct(int stockQty, int reservedQty, BigDecimal price) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Category category = categoryRepository.save(Category.builder()
                .nameAr("ساعات اختبارية " + suffix)
                .nameEn("Test Watches " + suffix)
                .slug("test-watches-" + suffix)
                .isActive(true)
                .build());

        return productRepository.save(Product.builder()
                .category(category)
                .nameAr("ساعة فارليون اختبارية " + suffix)
                .nameEn("Varellion Test Watch " + suffix)
                .sku("VAR-IT-" + suffix.toUpperCase())
                .price(price)
                .costPrice(price.divide(BigDecimal.valueOf(2)))
                .stockQuantity(stockQty)
                .reservedQuantity(reservedQty)
                .isActive(true)
                .build());
    }

    private CreateOrderRequest buildOrderRequest(UUID productId, int quantity, String customerName, String phone) {
        return CreateOrderRequest.builder()
                .customerName(customerName)
                .customerPhone(phone)
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9، عمارة 12")
                .paymentMethod("CASH_ON_DELIVERY")
                .items(List.of(new CreateOrderRequest.CreateOrderItemRequest(productId, quantity)))
                .build();
    }

    @Test
    @DisplayName("createOrder: Persists order, items, history, server-side totals, and increments reservedQuantity without deducting stockQuantity")
    void createOrder_PersistsToDatabaseAndIncrementsReservedOnly() {
        User user = createRegisteredUser("buyer", "USER");
        Product product = createProduct(10, 0, new BigDecimal("1000.00"));

        CreateOrderRequest request = buildOrderRequest(product.getProductId(), 2, "أحمد طارق", "01011223344");
        OrderResponseDto created = orderService.createOrder(user.getEmail(), request);

        assertThat(created.getOrderNumber()).isNotBlank();
        assertThat(created.getOrderStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION);
        assertThat(created.getSubtotal()).isEqualByComparingTo("2000.00");
        assertThat(created.getShippingFee()).isEqualByComparingTo("50.00");
        assertThat(created.getTotalAmount()).isEqualByComparingTo("2050.00");
        assertThat(created.getPaymentMethod()).isEqualTo("CASH_ON_DELIVERY");

        Order persistedOrder = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
        assertThat(persistedOrder.getOrderStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION);
        assertThat(persistedOrder.getVersion()).isEqualTo(0L);
        assertThat(persistedOrder.getSubtotal()).isEqualByComparingTo("2000.00");
        assertThat(persistedOrder.getShippingFee()).isEqualByComparingTo("50.00");
        assertThat(persistedOrder.getTotalAmount()).isEqualByComparingTo("2050.00");
        assertThat(persistedOrder.getItems()).hasSize(1);
        assertThat(persistedOrder.getItems().get(0).getProduct().getProductId()).isEqualTo(product.getProductId());
        assertThat(persistedOrder.getItems().get(0).getQuantity()).isEqualTo(2);
        assertThat(persistedOrder.getItems().get(0).getUnitPrice()).isEqualByComparingTo("1000.00");
        assertThat(persistedOrder.getItems().get(0).getLineTotal()).isEqualByComparingTo("2000.00");

        List<OrderStatusHistory> history = orderStatusHistoryRepository
                .findByOrderOrderIdOrderByCreatedAtAsc(persistedOrder.getOrderId());
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getNewStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name());

        Product persistedProduct = productRepository.findById(product.getProductId()).orElseThrow();
        assertThat(persistedProduct.getStockQuantity()).isEqualTo(10);
        assertThat(persistedProduct.getReservedQuantity()).isEqualTo(2);
        assertThat(persistedProduct.getStockQuantity() - persistedProduct.getReservedQuantity()).isEqualTo(8);
    }

    @Test
    @DisplayName("createOrder: Missing product ID is rejected safely with ResourceNotFoundException and persists no order")
    void createOrder_MissingProductId_RejectsWithoutPersistingOrder() {
        User user = createRegisteredUser("missing-prod", "USER");
        Customer customer = preProvisionCustomer(user, "سالم محمود", "01022334455");
        UUID missingProductId = UUID.randomUUID();
        long ordersBefore = orderRepository.countOrdersByCustomer(customer.getUserId());

        CreateOrderRequest request = buildOrderRequest(missingProductId, 1, "سالم محمود", "01022334455");

        assertThatThrownBy(() -> orderService.createOrder(user.getEmail(), request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(missingProductId.toString());

        long ordersAfter = orderRepository.countOrdersByCustomer(customer.getUserId());
        assertThat(ordersAfter).isEqualTo(ordersBefore);
    }

    @Test
    @DisplayName("updateOrderStatus: PENDING_CUSTOMER_CONFIRMATION -> CANCELLED releases reserved stock and persists audit history")
    void updateOrderStatus_PendingToCancelled_ReleasesReservationInDatabase() {
        User customerUser = createRegisteredUser("cancel-pending", "USER");
        User adminUser = createRegisteredUser("admin-cancel", "ADMIN");
        Product product = createProduct(10, 0, new BigDecimal("800.00"));

        OrderResponseDto created = orderService.createOrder(
                customerUser.getEmail(),
                buildOrderRequest(product.getProductId(), 3, "نور الدين", "01033445566")
        );

        Product afterCreate = productRepository.findById(product.getProductId()).orElseThrow();
        assertThat(afterCreate.getStockQuantity()).isEqualTo(10);
        assertThat(afterCreate.getReservedQuantity()).isEqualTo(3);

        OrderResponseDto cancelled = orderService.updateOrderStatus(
                created.getOrderNumber(),
                OrderStatus.CANCELLED,
                "Customer cancelled before confirmation",
                adminUser.getId()
        );
        assertThat(cancelled.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);

        Order persistedOrder = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
        assertThat(persistedOrder.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(persistedOrder.getVersion()).isEqualTo(1L);

        Product afterCancel = productRepository.findById(product.getProductId()).orElseThrow();
        assertThat(afterCancel.getStockQuantity()).isEqualTo(10);
        assertThat(afterCancel.getReservedQuantity()).isEqualTo(0);

        List<OrderStatusHistory> history = orderStatusHistoryRepository
                .findByOrderOrderIdOrderByCreatedAtAsc(persistedOrder.getOrderId());
        assertThat(history).hasSize(2);
        assertThat(history.get(1).getPreviousStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name());
        assertThat(history.get(1).getNewStatus()).isEqualTo(OrderStatus.CANCELLED.name());
        assertThat(history.get(1).getActorId()).isEqualTo(adminUser.getId());
    }

    @Test
    @DisplayName("Concurrency: Two customers competing for the last available unit succeed exactly once with zero overselling")
    void createOrder_TwoConcurrentCustomersCompeteForLastUnit_PreventsOverselling() throws Exception {
        User user1 = createRegisteredUser("race-buyer-1", "USER");
        User user2 = createRegisteredUser("race-buyer-2", "USER");
        Customer customer1 = preProvisionCustomer(user1, "عميل سباق 1", "01044556677");
        Customer customer2 = preProvisionCustomer(user2, "عميل سباق 2", "01055667788");
        Product lastUnitProduct = createProduct(1, 0, new BigDecimal("2000.00"));

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Callable<Object> task1 = () -> {
            barrier.await(5, TimeUnit.SECONDS);
            try {
                return orderService.createOrder(
                        user1.getEmail(),
                        buildOrderRequest(lastUnitProduct.getProductId(), 1, "عميل سباق 1", "01044556677")
                );
            } catch (Exception ex) {
                return ex;
            }
        };

        Callable<Object> task2 = () -> {
            barrier.await(5, TimeUnit.SECONDS);
            try {
                return orderService.createOrder(
                        user2.getEmail(),
                        buildOrderRequest(lastUnitProduct.getProductId(), 1, "عميل سباق 2", "01055667788")
                );
            } catch (Exception ex) {
                return ex;
            }
        };

        Future<Object> f1 = executor.submit(task1);
        Future<Object> f2 = executor.submit(task2);
        Object r1 = f1.get(10, TimeUnit.SECONDS);
        Object r2 = f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        List<Object> results = List.of(r1, r2);
        List<OrderResponseDto> successes = results.stream()
                .filter(OrderResponseDto.class::isInstance)
                .map(OrderResponseDto.class::cast)
                .toList();
        List<Throwable> failures = results.stream()
                .filter(Throwable.class::isInstance)
                .map(Throwable.class::cast)
                .toList();

        assertThat(successes).hasSize(1);
        assertThat(failures).hasSize(1);
        assertThat(failures.get(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("غير متوفرة في المخزون");

        Product finalProduct = productRepository.findById(lastUnitProduct.getProductId()).orElseThrow();
        assertThat(finalProduct.getStockQuantity()).isEqualTo(1);
        assertThat(finalProduct.getReservedQuantity()).isEqualTo(1);
        assertThat(finalProduct.getStockQuantity() - finalProduct.getReservedQuantity()).isEqualTo(0);

        long totalOrdersCreated = orderRepository.countOrdersByCustomer(customer1.getUserId())
                + orderRepository.countOrdersByCustomer(customer2.getUserId());
        assertThat(totalOrdersCreated).isEqualTo(1L);
    }

    @Test
    @DisplayName("Optimistic Locking & Rollback: Stale @Version commit fails with ObjectOptimisticLockingFailureException and rolls back inventory")
    void updateOrderStatus_StaleOrderVersion_ThrowsOptimisticLockAndRollsBackInventory() throws Exception {
        User customerUser = createRegisteredUser("opt-lock-buyer", "USER");
        User adminA = createRegisteredUser("admin-a", "ADMIN");
        User adminB = createRegisteredUser("admin-b", "ADMIN");
        Product product = createProduct(10, 0, new BigDecimal("950.00"));

        OrderResponseDto created = orderService.createOrder(
                customerUser.getEmail(),
                buildOrderRequest(product.getProductId(), 3, "كريم حسن", "01066778899")
        );
        orderService.updateOrderStatus(created.getOrderNumber(), OrderStatus.CONFIRMED, "Confirmed", adminA.getId());

        Order beforeConflict = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
        assertThat(beforeConflict.getVersion()).isEqualTo(1L);
        assertThat(beforeConflict.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);

        ExecutorService otherTxExecutor = Executors.newSingleThreadExecutor();
        try {
            assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(status -> {
                // 1. TX1 loads Order (version = 1, CONFIRMED) into its persistence context
                Order staleOrder = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
                assertThat(staleOrder.getVersion()).isEqualTo(1L);

                // 2. Separate thread/transaction concurrently advances Order to PREPARING (version -> 2) and commits
                try {
                    otherTxExecutor.submit(() -> orderService.updateOrderStatus(
                            created.getOrderNumber(),
                            OrderStatus.PREPARING,
                            "Admin B moved to preparing",
                            adminB.getId()
                    )).get(10, TimeUnit.SECONDS);
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }

                // 3. TX1 attempts CONFIRMED -> SHIPPED with stale version = 1; mutates Product stock/reserved inside TX1
                orderService.updateOrderStatus(
                        created.getOrderNumber(),
                        OrderStatus.SHIPPED,
                        "Admin A stale shipment",
                        adminA.getId()
                );
            }))
                    .satisfies(ex -> assertThat(
                            ex instanceof ObjectOptimisticLockingFailureException
                                    || ex instanceof OptimisticLockException
                                    || ex.getCause() instanceof OptimisticLockException
                    ).as("Expected optimistic lock conflict exception, got %s", ex).isTrue());
        } finally {
            otherTxExecutor.shutdown();
            assertThat(otherTxExecutor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }

        // 4. Verify DB state: Admin B's PREPARING (version 2) persisted, and TX1's SHIPPED + inventory deduction rolled back
        Order finalOrder = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
        assertThat(finalOrder.getOrderStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(finalOrder.getVersion()).isEqualTo(2L);

        Product finalProduct = productRepository.findById(product.getProductId()).orElseThrow();
        assertThat(finalProduct.getStockQuantity()).isEqualTo(10);
        assertThat(finalProduct.getReservedQuantity()).isEqualTo(3);

        List<OrderStatusHistory> history = orderStatusHistoryRepository
                .findByOrderOrderIdOrderByCreatedAtAsc(finalOrder.getOrderId());
        assertThat(history)
                .extracting(OrderStatusHistory::getNewStatus)
                .containsExactly(
                        OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name(),
                        OrderStatus.CONFIRMED.name(),
                        OrderStatus.PREPARING.name()
                );
    }

    @Test
    @DisplayName("Concurrency: Two threads racing SHIPPED vs CANCELLED on the same order never corrupt inventory invariants")
    void updateOrderStatus_ConcurrentShippedVsCancelledOnSameOrder_PreservesConsistency() throws Exception {
        User customerUser = createRegisteredUser("race-status-buyer", "USER");
        User admin1 = createRegisteredUser("race-admin-1", "ADMIN");
        User admin2 = createRegisteredUser("race-admin-2", "ADMIN");
        Product product = createProduct(10, 0, new BigDecimal("700.00"));

        OrderResponseDto created = orderService.createOrder(
                customerUser.getEmail(),
                buildOrderRequest(product.getProductId(), 3, "محمود سامي", "01077889900")
        );
        orderService.updateOrderStatus(created.getOrderNumber(), OrderStatus.CONFIRMED, "Confirmed", admin1.getId());

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Future<Object> shipFuture = executor.submit(() -> {
            barrier.await(5, TimeUnit.SECONDS);
            try {
                return orderService.updateOrderStatus(
                        created.getOrderNumber(), OrderStatus.SHIPPED, "Dispatched", admin1.getId());
            } catch (Exception ex) {
                return ex;
            }
        });

        Future<Object> cancelFuture = executor.submit(() -> {
            barrier.await(5, TimeUnit.SECONDS);
            try {
                return orderService.updateOrderStatus(
                        created.getOrderNumber(), OrderStatus.CANCELLED, "Cancelled", admin2.getId());
            } catch (Exception ex) {
                return ex;
            }
        });

        Object shipOutcome = shipFuture.get(10, TimeUnit.SECONDS);
        Object cancelOutcome = cancelFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();

        // Any failure must be a clean domain rejection or optimistic lock conflict (never silent corruption)
        for (Object outcome : List.of(shipOutcome, cancelOutcome)) {
            if (outcome instanceof Throwable t) {
                assertThat(
                        t instanceof ObjectOptimisticLockingFailureException
                                || t instanceof OptimisticLockException
                                || t instanceof BusinessException
                ).as("Unexpected failure type: %s", t).isTrue();
            }
        }

        Order finalOrder = orderRepository.findByOrderNumberWithDetails(created.getOrderNumber()).orElseThrow();
        Product finalProduct = productRepository.findById(product.getProductId()).orElseThrow();
        List<OrderStatusHistory> history = orderStatusHistoryRepository
                .findByOrderOrderIdOrderByCreatedAtAsc(finalOrder.getOrderId());
        boolean wasShipped = history.stream().anyMatch(h -> OrderStatus.SHIPPED.name().equals(h.getNewStatus()));

        assertThat(finalProduct.getReservedQuantity()).isEqualTo(0);
        if (wasShipped) {
            // Either SHIPPED won alone, or SHIPPED committed first followed by post-shipment CANCELLED (SEC-INV-01: no auto-restock)
            assertThat(finalProduct.getStockQuantity()).isEqualTo(7);
        } else {
            // CANCELLED won before shipment: physical stock untouched, reservation released
            assertThat(finalOrder.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(finalProduct.getStockQuantity()).isEqualTo(10);
        }
        assertThat(finalProduct.getReservedQuantity()).isLessThanOrEqualTo(finalProduct.getStockQuantity());
    }
}
