package com.varellion.store.cart.repository;

import com.varellion.store.cart.entity.Cart;
import com.varellion.store.cart.entity.CartItem;
import com.varellion.store.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);

    Optional<CartItem> findByCartCartIdAndCartItemId(UUID cartId, UUID cartItemId);

    void deleteByCartCartId(UUID cartId);
}
