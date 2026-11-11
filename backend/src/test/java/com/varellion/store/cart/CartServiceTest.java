package com.varellion.store.cart;

import com.varellion.store.cart.dto.AddToCartRequest;
import com.varellion.store.cart.dto.CartDto;
import com.varellion.store.cart.dto.MergeCartRequest;
import com.varellion.store.cart.entity.Cart;
import com.varellion.store.cart.entity.CartItem;
import com.varellion.store.cart.repository.CartItemRepository;
import com.varellion.store.cart.repository.CartRepository;
import com.varellion.store.cart.service.CartService;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private Customer testCustomer;
    private Cart testCart;
    private Product testProduct;
    private UUID customerId;
    private UUID productId;
    private UUID cartId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        productId = UUID.randomUUID();
        cartId = UUID.randomUUID();

        testCustomer = Customer.builder()
                .userId(customerId)
                .fullName("Mohamed Ali")
                .isActive(true)
                .build();

        testCart = Cart.builder()
                .cartId(cartId)
                .customer(testCustomer)
                .items(new ArrayList<>())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        testProduct = Product.builder()
                .productId(productId)
                .nameEn("Leather Jacket")
                .nameAr("جاكيت جلدي")
                .price(new BigDecimal("1000.00"))
                .stockQuantity(10)
                .reservedQuantity(2) // Available stock = 8
                .isActive(true)
                .images(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("getCart: Creates a new cart when no existing cart is found for the customer")
    void getCart_createsNewCartIfNoneExists() {
        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDto result = cartService.getCart("user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getItems()).isEmpty();
        assertThat(result.getTotalItems()).isEqualTo(0);
        assertThat(result.getSubtotal()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("addItem: Adds new item to cart and clamps quantity to available stock")
    void addItem_addsNewItemClampedToStock() {
        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(productRepository.findByProductId(productId)).thenReturn(Optional.of(testProduct));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        AddToCartRequest request = AddToCartRequest.builder()
                .productId(productId)
                .quantity(5)
                .build();

        CartDto result = cartService.addItem("user@test.com", request);

        assertThat(result).isNotNull();
        assertThat(testCart.getItems()).hasSize(1);
        CartItem added = testCart.getItems().get(0);
        assertThat(added.getQuantity()).isEqualTo(5);
        assertThat(added.getProduct()).isEqualTo(testProduct);
    }

    @Test
    @DisplayName("addItem: Increments quantity when item already exists, respecting stock limit")
    void addItem_incrementsQuantityIfItemExists() {
        CartItem existingItem = CartItem.builder()
                .cartItemId(UUID.randomUUID())
                .cart(testCart)
                .product(testProduct)
                .quantity(5)
                .build();
        testCart.getItems().add(existingItem);

        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(productRepository.findByProductId(productId)).thenReturn(Optional.of(testProduct));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        // Requested 5 more, but stock is 8, so 5 + 5 = 10 -> clamped to 8
        AddToCartRequest request = AddToCartRequest.builder()
                .productId(productId)
                .quantity(5)
                .build();

        CartDto result = cartService.addItem("user@test.com", request);

        assertThat(result).isNotNull();
        assertThat(testCart.getItems()).hasSize(1);
        assertThat(existingItem.getQuantity()).isEqualTo(8); // Available stock is 10 - 2 = 8
    }

    @Test
    @DisplayName("updateItemQuantity: Updates quantity or removes item if quantity is zero")
    void updateItemQuantity_updatesOrRemoves() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = CartItem.builder()
                .cartItemId(cartItemId)
                .cart(testCart)
                .product(testProduct)
                .quantity(3)
                .build();
        testCart.getItems().add(item);

        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        // Update to 6
        cartService.updateItemQuantity("user@test.com", cartItemId, 6);
        assertThat(item.getQuantity()).isEqualTo(6);

        // Update to 0 -> should remove
        cartService.updateItemQuantity("user@test.com", cartItemId, 0);
        assertThat(testCart.getItems()).isEmpty();
    }

    @Test
    @DisplayName("removeItem: Removes item by cartItemId")
    void removeItem_removesItemSuccessfully() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = CartItem.builder()
                .cartItemId(cartItemId)
                .cart(testCart)
                .product(testProduct)
                .quantity(2)
                .build();
        testCart.getItems().add(item);

        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        cartService.removeItem("user@test.com", cartItemId);
        assertThat(testCart.getItems()).isEmpty();
    }

    @Test
    @DisplayName("clearCart: Removes all items from cart")
    void clearCart_clearsAllItems() {
        CartItem item = CartItem.builder()
                .cartItemId(UUID.randomUUID())
                .cart(testCart)
                .product(testProduct)
                .quantity(2)
                .build();
        testCart.getItems().add(item);

        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        cartService.clearCart("user@test.com");
        assertThat(testCart.getItems()).isEmpty();
    }

    @Test
    @DisplayName("mergeCart: Sums guest items with existing items up to stock limit")
    void mergeCart_mergesGuestItemsWithExistingItemsAndSumsQuantities() {
        // Pre-existing 2 of testProduct in cart
        CartItem existingItem = CartItem.builder()
                .cartItemId(UUID.randomUUID())
                .cart(testCart)
                .product(testProduct)
                .quantity(2)
                .build();
        testCart.getItems().add(existingItem);

        // Second product
        UUID product2Id = UUID.randomUUID();
        Product product2 = Product.builder()
                .productId(product2Id)
                .nameEn("Shoes")
                .nameAr("حذاء")
                .price(new BigDecimal("500.00"))
                .stockQuantity(5)
                .reservedQuantity(0)
                .isActive(true)
                .images(new ArrayList<>())
                .build();

        when(customerService.getOrCreateCustomerForUser("user@test.com")).thenReturn(testCustomer);
        when(cartRepository.findByCustomer(testCustomer)).thenReturn(Optional.of(testCart));
        when(productRepository.findByProductId(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.findByProductId(product2Id)).thenReturn(Optional.of(product2));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        MergeCartRequest mergeRequest = MergeCartRequest.builder()
                .items(List.of(
                        AddToCartRequest.builder().productId(productId).quantity(3).build(), // 2 + 3 = 5
                        AddToCartRequest.builder().productId(product2Id).quantity(2).build()  // 2
                ))
                .build();

        CartDto result = cartService.mergeCart("user@test.com", mergeRequest);

        assertThat(result).isNotNull();
        assertThat(testCart.getItems()).hasSize(2);
        assertThat(existingItem.getQuantity()).isEqualTo(5);
        CartItem newItem = testCart.getItems().stream()
                .filter(i -> i.getProduct().getProductId().equals(product2Id))
                .findFirst().orElseThrow();
        assertThat(newItem.getQuantity()).isEqualTo(2);
    }
}
