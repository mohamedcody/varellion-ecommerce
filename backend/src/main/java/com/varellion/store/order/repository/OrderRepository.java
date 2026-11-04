package com.varellion.store.order.repository;

import com.varellion.store.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByOrderNumberWithDetails(@Param("orderNumber") String orderNumber);

    Optional<Order> findByOrderNumberIgnoreCase(String orderNumber);

    Page<Order> findByCustomerUserIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.customer.userId = :customerId AND LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByCustomerUserIdAndOrderNumber(@Param("customerId") UUID customerId, @Param("orderNumber") String orderNumber);

    boolean existsByOrderNumberIgnoreCase(String orderNumber);
}
