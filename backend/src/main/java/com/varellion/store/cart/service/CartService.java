package com.varellion.store.cart.service;

import com.varellion.store.cart.dto.*;
import com.varellion.store.cart.entity.Cart;
import com.varellion.store.cart.entity.CartItem;
import com.varellion.store.cart.repository.CartItemRepository;
import com.varellion.store.cart.repository.CartRepository;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("2500.00");

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CustomerService customerService;
    private final ProductRepository productRepository;

    /**
     * Retrieves the active cart for the authenticated customer, or creates one if it does not exist.
     */
    @Transactional
    public CartDto getCart(String userEmail) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);
        return toCartDto(cart);
    }

    /**
     * Adds a product to the customer's cart.
     * Increments quantity if already present, clamping to available stock.
     */
    @Transactional
    public CartDto addItem(String userEmail, AddToCartRequest request) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);

        Product product = productRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("المنتج غير موجود"));

        if (Boolean.FALSE.equals(product.getIsActive())) {
            throw new IllegalArgumentException("المنتج غير متاح حالياً");
        }

        int availableStock = calculateAvailableStock(product);
        if (availableStock <= 0) {
            throw new IllegalArgumentException("المنتج غير متوفر حالياً بالمخزون");
        }

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getProductId().equals(product.getProductId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = Math.min(existingItem.getQuantity() + request.getQuantity(), availableStock);
            existingItem.setQuantity(newQuantity);
        } else {
            int initialQuantity = Math.min(request.getQuantity(), availableStock);
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(initialQuantity)
                    .build();
            cart.getItems().add(newItem);
        }

        Cart saved = cartRepository.save(cart);
        return toCartDto(saved);
    }

    /**
     * Updates an existing item's quantity in the cart.
     * If quantity is 0 or less, the item is removed.
     */
    @Transactional
    public CartDto updateItemQuantity(String userEmail, UUID cartItemId, int newQuantity) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);

        CartItem item = cart.getItems().stream()
                .filter(i -> cartItemId.equals(i.getCartItemId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("العنصر غير موجود في السلة"));

        if (newQuantity <= 0) {
            cart.getItems().remove(item);
        } else {
            int availableStock = calculateAvailableStock(item.getProduct());
            item.setQuantity(Math.min(newQuantity, availableStock));
        }

        Cart saved = cartRepository.save(cart);
        return toCartDto(saved);
    }

    /**
     * Removes an item from the customer's cart.
     */
    @Transactional
    public CartDto removeItem(String userEmail, UUID cartItemId) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);

        cart.getItems().removeIf(item -> cartItemId.equals(item.getCartItemId()));

        Cart saved = cartRepository.save(cart);
        return toCartDto(saved);
    }

    /**
     * Clears all items from the customer's cart.
     */
    @Transactional
    public void clearCart(String userEmail) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);

        cart.getItems().clear();
        cartRepository.save(cart);
    }

    /**
     * Merges guest items into customer cart on login.
     * Sums quantities for duplicates, clamping to available stock.
     */
    @Transactional
    public CartDto mergeCart(String userEmail, MergeCartRequest request) {
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail);
        Cart cart = getOrCreateCartEntity(customer);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (AddToCartRequest guestItem : request.getItems()) {
                if (guestItem.getProductId() == null || guestItem.getQuantity() == null || guestItem.getQuantity() <= 0) {
                    continue;
                }

                Optional<Product> productOpt = productRepository.findByProductId(guestItem.getProductId());
                if (productOpt.isEmpty() || Boolean.FALSE.equals(productOpt.get().getIsActive())) {
                    continue;
                }

                Product product = productOpt.get();
                int availableStock = calculateAvailableStock(product);
                if (availableStock <= 0) {
                    continue;
                }

                Optional<CartItem> existingItemOpt = cart.getItems().stream()
                        .filter(i -> i.getProduct().getProductId().equals(product.getProductId()))
                        .findFirst();

                if (existingItemOpt.isPresent()) {
                    CartItem existingItem = existingItemOpt.get();
                    int combined = Math.min(existingItem.getQuantity() + guestItem.getQuantity(), availableStock);
                    existingItem.setQuantity(combined);
                } else {
                    int initial = Math.min(guestItem.getQuantity(), availableStock);
                    CartItem newItem = CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(initial)
                            .build();
                    cart.getItems().add(newItem);
                }
            }
        }

        Cart saved = cartRepository.save(cart);
        return toCartDto(saved);
    }

    private Cart getOrCreateCartEntity(Customer customer) {
        return cartRepository.findByCustomer(customer)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .customer(customer)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private int calculateAvailableStock(Product product) {
        int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int reserved = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
        return Math.max(0, stock - reserved);
    }

    public CartDto toCartDto(Cart cart) {
        List<CartItemDto> itemDtos = new ArrayList<>();
        int totalItems = 0;
        BigDecimal subtotal = BigDecimal.ZERO;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                CartItemDto dto = toCartItemDto(item);
                itemDtos.add(dto);
                totalItems += dto.getQuantity();
                subtotal = subtotal.add(dto.getSubtotal());
            }
        }

        BigDecimal amountForFreeShipping = FREE_SHIPPING_THRESHOLD.subtract(subtotal);
        if (amountForFreeShipping.compareTo(BigDecimal.ZERO) < 0) {
            amountForFreeShipping = BigDecimal.ZERO;
        }

        return CartDto.builder()
                .cartId(cart.getCartId())
                .customerId(cart.getCustomer() != null ? cart.getCustomer().getUserId() : null)
                .items(itemDtos)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .freeShippingThreshold(FREE_SHIPPING_THRESHOLD)
                .amountForFreeShipping(amountForFreeShipping)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    public CartItemDto toCartItemDto(CartItem item) {
        Product p = item.getProduct();
        int availableStock = calculateAvailableStock(p);
        BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
        int quantity = item.getQuantity() != null ? item.getQuantity() : 1;
        BigDecimal itemSubtotal = price.multiply(BigDecimal.valueOf(quantity));

        String imageUrl = null;
        if (p.getImages() != null && !p.getImages().isEmpty()) {
            imageUrl = p.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElseGet(() -> p.getImages().get(0).getImageUrl());
        }

        return CartItemDto.builder()
                .cartItemId(item.getCartItemId())
                .productId(p.getProductId())
                .nameAr(p.getNameAr())
                .nameEn(p.getNameEn())
                .sku(p.getSku())
                .price(price)
                .imageUrl(imageUrl)
                .quantity(quantity)
                .availableStock(availableStock)
                .subtotal(itemSubtotal)
                .addedAt(item.getCreatedAt())
                .build();
    }
}
