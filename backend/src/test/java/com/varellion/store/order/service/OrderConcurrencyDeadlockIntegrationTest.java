package com.varellion.store.order.service;

import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderItem;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
class OrderConcurrencyDeadlockIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    @DisplayName("Concurrent status transitions on orders with opposite product ordering succeed without deadlock")
    void testConcurrentStatusUpdatesWithOppositeProductOrdering_NoDeadlock() throws Exception {
        // 1. Setup Category and Customer
        Category category = Category.builder()
                .nameAr("إكسسوارات رجالية")
                .nameEn("Men Accessories")
                .slug("men-accessories-" + UUID.randomUUID())
                .isActive(true)
                .build();
        category = categoryRepository.save(category);

        Customer customer = Customer.builder()
                .userId(UUID.randomUUID())
                .fullName("أحمد متزامن")
                .phoneNumber("01099887766")
                .isActive(true)
                .build();
        customer = customerRepository.save(customer);

        // 2. Setup two Products with distinct UUIDs
        Product pA = Product.builder()
                .category(category)
                .nameAr("خاتم فضة")
                .nameEn("Silver Ring")
                .sku("VAR-RING-" + UUID.randomUUID().toString().substring(0, 8))
                .price(BigDecimal.valueOf(500))
                .costPrice(BigDecimal.valueOf(250))
                .stockQuantity(100)
                .reservedQuantity(20)
                .isActive(true)
                .build();
        pA = productRepository.save(pA);

        Product pB = Product.builder()
                .category(category)
                .nameAr("سوار جلد")
                .nameEn("Leather Bracelet")
                .sku("VAR-BRAC-" + UUID.randomUUID().toString().substring(0, 8))
                .price(BigDecimal.valueOf(400))
                .costPrice(BigDecimal.valueOf(200))
                .stockQuantity(100)
                .reservedQuantity(20)
                .isActive(true)
                .build();
        pB = productRepository.save(pB);

        // Determine lower UUID (minProduct) and higher UUID (maxProduct)
        Product minProduct = pA.getProductId().compareTo(pB.getProductId()) < 0 ? pA : pB;
        Product maxProduct = pA.getProductId().compareTo(pB.getProductId()) < 0 ? pB : pA;

        // 3. Create Order 1 with items in REVERSE order: [maxProduct, minProduct]
        String orderNumber1 = "VAR-DEADLOCK-0001";
        Order order1 = Order.builder()
                .orderNumber(orderNumber1)
                .customer(customer)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhoneNumber())
                .shippingGovernorate("القاهرة")
                .shippingCityArea("المعادي")
                .shippingDetailedAddress("شارع 9")
                .subtotal(BigDecimal.valueOf(900))
                .totalAmount(BigDecimal.valueOf(950))
                .shippingFee(BigDecimal.valueOf(50))
                .orderStatus(OrderStatus.CONFIRMED)
                .build();

        OrderItem item1A = OrderItem.builder()
                .order(order1)
                .product(maxProduct)
                .productNameAr(maxProduct.getNameAr())
                .productNameEn(maxProduct.getNameEn())
                .sku(maxProduct.getSku())
                .unitCost(maxProduct.getCostPrice())
                .quantity(5)
                .unitPrice(maxProduct.getPrice())
                .lineTotal(maxProduct.getPrice().multiply(BigDecimal.valueOf(5)))
                .build();
        OrderItem item1B = OrderItem.builder()
                .order(order1)
                .product(minProduct)
                .productNameAr(minProduct.getNameAr())
                .productNameEn(minProduct.getNameEn())
                .sku(minProduct.getSku())
                .unitCost(minProduct.getCostPrice())
                .quantity(5)
                .unitPrice(minProduct.getPrice())
                .lineTotal(minProduct.getPrice().multiply(BigDecimal.valueOf(5)))
                .build();
        order1.setItems(new ArrayList<>(List.of(item1A, item1B)));
        orderRepository.save(order1);

        // 4. Create Order 2 with items in NATURAL order: [minProduct, maxProduct]
        String orderNumber2 = "VAR-DEADLOCK-0002";
        Order order2 = Order.builder()
                .orderNumber(orderNumber2)
                .customer(customer)
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhoneNumber())
                .shippingGovernorate("الجيزة")
                .shippingCityArea("الدقي")
                .shippingDetailedAddress("شارع التحرير")
                .subtotal(BigDecimal.valueOf(900))
                .totalAmount(BigDecimal.valueOf(950))
                .shippingFee(BigDecimal.valueOf(50))
                .orderStatus(OrderStatus.CONFIRMED)
                .build();

        OrderItem item2A = OrderItem.builder()
                .order(order2)
                .product(minProduct)
                .productNameAr(minProduct.getNameAr())
                .productNameEn(minProduct.getNameEn())
                .sku(minProduct.getSku())
                .unitCost(minProduct.getCostPrice())
                .quantity(5)
                .unitPrice(minProduct.getPrice())
                .lineTotal(minProduct.getPrice().multiply(BigDecimal.valueOf(5)))
                .build();
        OrderItem item2B = OrderItem.builder()
                .order(order2)
                .product(maxProduct)
                .productNameAr(maxProduct.getNameAr())
                .productNameEn(maxProduct.getNameEn())
                .sku(maxProduct.getSku())
                .unitCost(maxProduct.getCostPrice())
                .quantity(5)
                .unitPrice(maxProduct.getPrice())
                .lineTotal(maxProduct.getPrice().multiply(BigDecimal.valueOf(5)))
                .build();
        order2.setItems(new ArrayList<>(List.of(item2A, item2B)));
        orderRepository.save(order2);

        // 5. Execute concurrent transitions on both orders
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<OrderResponseDto> future1 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return orderService.updateOrderStatus(orderNumber1, OrderStatus.SHIPPED, "Shipped thread 1", 101L);
        });

        Future<OrderResponseDto> future2 = executor.submit(() -> {
            readyLatch.countDown();
            startLatch.await();
            return orderService.updateOrderStatus(orderNumber2, OrderStatus.SHIPPED, "Shipped thread 2", 102L);
        });

        // Ensure both threads are alive and ready before firing
        boolean ready = readyLatch.await(5, TimeUnit.SECONDS);
        assertThat(ready).isTrue();

        startLatch.countDown(); // Trigger both threads simultaneously

        // 6. Verify both complete cleanly within timeout without deadlock
        OrderResponseDto res1 = future1.get(10, TimeUnit.SECONDS);
        OrderResponseDto res2 = future2.get(10, TimeUnit.SECONDS);

        executor.shutdown();

        assertThat(res1.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(res2.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);

        // 7. Verify inventory correctly decremented by both transactions (5 + 5 = 10 deducted each)
        Product updatedMin = productRepository.findById(minProduct.getProductId()).orElseThrow();
        Product updatedMax = productRepository.findById(maxProduct.getProductId()).orElseThrow();

        assertThat(updatedMin.getStockQuantity()).isEqualTo(90); // 100 - 5 - 5
        assertThat(updatedMin.getReservedQuantity()).isEqualTo(10); // 20 - 5 - 5

        assertThat(updatedMax.getStockQuantity()).isEqualTo(90);
        assertThat(updatedMax.getReservedQuantity()).isEqualTo(10);
    }
}
