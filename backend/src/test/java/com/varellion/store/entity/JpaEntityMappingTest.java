package com.varellion.store.entity;

import com.varellion.store.cart.entity.Cart;
import com.varellion.store.cart.entity.CartItem;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.entity.CustomerAddress;
import com.varellion.store.order.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(locations = "classpath:application-test.properties")
class JpaEntityMappingTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Should successfully persist and query Customer and CustomerAddress 1:1 mapping")
    void testCustomerAndAddressPersistence() {
        UUID customerId = UUID.randomUUID();
        Customer customer = Customer.builder()
                .userId(customerId)
                .fullName("Karim Ahmed")
                .phoneNumber("+201001234567")
                .isActive(true)
                .build();

        Customer persistedCustomer = entityManager.persistAndFlush(customer);
        assertThat(persistedCustomer.getUserId()).isEqualTo(customerId);

        CustomerAddress address = CustomerAddress.builder()
                .customer(persistedCustomer)
                .governorate("Cairo")
                .cityArea("New Cairo")
                .detailedAddress("Plot 42, 5th Settlement")
                .build();

        CustomerAddress persistedAddress = entityManager.persistAndFlush(address);
        assertThat(persistedAddress.getAddressId()).isNotNull();
        assertThat(persistedAddress.getCustomer().getUserId()).isEqualTo(customerId);
    }

    @Test
    @DisplayName("Should successfully persist Category, Product, and ProductImages hierarchy")
    void testCatalogHierarchyPersistence() {
        Category category = Category.builder()
                .nameAr("ساعات رجالي")
                .nameEn("Men Watches")
                .slug("men-watches")
                .descriptionAr("تشكيلة ساعات فاخرة")
                .descriptionEn("Luxury watches collection")
                .isActive(true)
                .build();

        Category persistedCategory = entityManager.persistAndFlush(category);
        assertThat(persistedCategory.getCategoryId()).isNotNull();

        Product product = Product.builder()
                .category(persistedCategory)
                .nameAr("ساعة كرونوغراف كلاسيك")
                .nameEn("Classic Chronograph Watch")
                .descriptionAr("ساعة مقاومة للماء بسوار جلدي")
                .descriptionEn("Water-resistant watch with genuine leather strap")
                .sku("VAR-WAT-001")
                .price(new BigDecimal("2499.00"))
                .costPrice(new BigDecimal("1200.00"))
                .stockQuantity(15)
                .reservedQuantity(0)
                .isActive(true)
                .build();

        Product persistedProduct = entityManager.persistAndFlush(product);
        assertThat(persistedProduct.getProductId()).isNotNull();

        ProductImage image = ProductImage.builder()
                .product(persistedProduct)
                .imageUrl("https://images.varellion.com/watches/chrono-1.jpg")
                .isMain(true)
                .displayOrder(0)
                .build();

        ProductImage persistedImage = entityManager.persistAndFlush(image);
        assertThat(persistedImage.getImageId()).isNotNull();
    }

    @Test
    @DisplayName("Should successfully persist Cart and CartItem mapping")
    void testCartAndCartItemPersistence() {
        Customer customer = Customer.builder()
                .userId(UUID.randomUUID())
                .fullName("Omar Tarek")
                .phoneNumber("+201112223344")
                .isActive(true)
                .build();
        entityManager.persistAndFlush(customer);

        Category category = Category.builder()
                .nameAr("محافظ جلد")
                .nameEn("Leather Wallets")
                .slug("leather-wallets")
                .build();
        entityManager.persistAndFlush(category);

        Product product = Product.builder()
                .category(category)
                .nameAr("محفظة جلد طبيعي")
                .nameEn("Genuine Leather Wallet")
                .sku("VAR-WAL-001")
                .price(new BigDecimal("650.00"))
                .costPrice(new BigDecimal("300.00"))
                .stockQuantity(20)
                .reservedQuantity(0)
                .isActive(true)
                .build();
        entityManager.persistAndFlush(product);

        Cart cart = Cart.builder()
                .customer(customer)
                .build();
        Cart persistedCart = entityManager.persistAndFlush(cart);
        assertThat(persistedCart.getCartId()).isNotNull();

        CartItem item = CartItem.builder()
                .cart(persistedCart)
                .product(product)
                .quantity(2)
                .build();
        CartItem persistedItem = entityManager.persistAndFlush(item);
        assertThat(persistedItem.getCartItemId()).isNotNull();
        assertThat(persistedItem.getQuantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should successfully persist Order, OrderItem, and OrderStatusHistory with Enums")
    void testOrderLifecyclePersistence() {
        Customer customer = Customer.builder()
                .userId(UUID.randomUUID())
                .fullName("Sherif Mahmoud")
                .phoneNumber("+201223334455")
                .isActive(true)
                .build();
        entityManager.persistAndFlush(customer);

        Category category = Category.builder()
                .nameAr("إكسسوارات")
                .nameEn("Accessories")
                .slug("accessories")
                .build();
        entityManager.persistAndFlush(category);

        Product product = Product.builder()
                .category(category)
                .nameAr("كابل شحن سريع")
                .nameEn("Fast Charging Braided Cable")
                .sku("VAR-CAB-001")
                .price(new BigDecimal("299.00"))
                .costPrice(new BigDecimal("110.00"))
                .stockQuantity(50)
                .reservedQuantity(1)
                .isActive(true)
                .build();
        entityManager.persistAndFlush(product);

        Order order = Order.builder()
                .orderNumber("VAR-20261019-0001")
                .customer(customer)
                .customerName("Sherif Mahmoud")
                .customerPhone("+201223334455")
                .shippingGovernorate("Giza")
                .shippingCityArea("Sheikh Zayed")
                .shippingDetailedAddress("Building 15, District 4")
                .currency("EGP")
                .subtotal(new BigDecimal("299.00"))
                .discountTotal(BigDecimal.ZERO)
                .shippingFee(new BigDecimal("50.00"))
                .totalAmount(new BigDecimal("349.00"))
                .orderStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION)
                .shippingFeeStatus(ShippingFeeStatus.CONFIRMED)
                .confirmationDeadline(OffsetDateTime.now().plusHours(24))
                .build();

        Order persistedOrder = entityManager.persistAndFlush(order);
        assertThat(persistedOrder.getOrderId()).isNotNull();
        assertThat(persistedOrder.getOrderStatus()).isEqualTo(OrderStatus.PENDING_CUSTOMER_CONFIRMATION);

        OrderItem orderItem = OrderItem.builder()
                .order(persistedOrder)
                .product(product)
                .productNameAr(product.getNameAr())
                .productNameEn(product.getNameEn())
                .sku(product.getSku())
                .unitPrice(product.getPrice())
                .unitCost(product.getCostPrice())
                .quantity(1)
                .lineTotal(new BigDecimal("299.00"))
                .build();

        OrderItem persistedOrderItem = entityManager.persistAndFlush(orderItem);
        assertThat(persistedOrderItem.getOrderItemId()).isNotNull();

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(persistedOrder)
                .previousStatus(null)
                .newStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name())
                .reason("Order created by customer via checkout")
                .actorId(customer.getUserId())
                .build();

        OrderStatusHistory persistedHistory = entityManager.persistAndFlush(history);
        assertThat(persistedHistory.getHistoryId()).isNotNull();
    }
}
