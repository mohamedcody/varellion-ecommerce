package com.varellion.store.order.repository;

import com.varellion.store.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrderOrderId(UUID orderId);

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.product.productId = :productId")
    boolean existsByProductId(@Param("productId") UUID productId);
}
