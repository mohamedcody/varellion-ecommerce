package com.varellion.store.cart.repository;

import com.varellion.store.cart.entity.Cart;
import com.varellion.store.customer.entity.Customer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Cart> findByCustomer(Customer customer);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Cart> findByCustomerUserId(UUID customerUserId);
}
