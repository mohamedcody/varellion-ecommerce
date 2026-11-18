package com.varellion.store.order.repository;

import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByOrderNumberWithDetails(@Param("orderNumber") String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByOrderNumberWithDetailsForUpdate(@Param("orderNumber") String orderNumber);

    Optional<Order> findByOrderNumberIgnoreCase(String orderNumber);

    Page<Order> findByCustomerUserIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.customer.userId = :customerId AND LOWER(o.orderNumber) = LOWER(:orderNumber)")
    Optional<Order> findByCustomerUserIdAndOrderNumber(@Param("customerId") UUID customerId, @Param("orderNumber") String orderNumber);

    boolean existsByOrderNumberIgnoreCase(String orderNumber);

    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.orderStatus = :status)
          AND (CAST(:search AS string) IS NULL OR (
               LOWER(o.orderNumber) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               o.customerPhone LIKE CONCAT('%', CAST(:search AS string), '%') OR
               LOWER(o.customerName) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')
          ))
    """)
    Page<Order> findAdminOrders(
            @Param("status") OrderStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus NOT IN (com.varellion.store.order.entity.OrderStatus.CANCELLED, com.varellion.store.order.entity.OrderStatus.EXPIRED)")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o GROUP BY o.orderStatus")
    List<Object[]> countOrdersGroupByStatus();

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.orderStatus NOT IN (com.varellion.store.order.entity.OrderStatus.CANCELLED, com.varellion.store.order.entity.OrderStatus.EXPIRED) ORDER BY o.createdAt ASC")
    List<Order> findOrdersForAnalytics(@Param("startDate") OffsetDateTime startDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.customer.userId = :customerId AND o.orderStatus NOT IN (com.varellion.store.order.entity.OrderStatus.CANCELLED, com.varellion.store.order.entity.OrderStatus.EXPIRED)")
    long countOrdersByCustomer(@Param("customerId") UUID customerId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.customer.userId = :customerId AND o.orderStatus NOT IN (com.varellion.store.order.entity.OrderStatus.CANCELLED, com.varellion.store.order.entity.OrderStatus.EXPIRED)")
    BigDecimal calculateTotalSpentByCustomer(@Param("customerId") UUID customerId);

    @Query("SELECT o.customer.userId, COUNT(o), COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus NOT IN (com.varellion.store.order.entity.OrderStatus.CANCELLED, com.varellion.store.order.entity.OrderStatus.EXPIRED) GROUP BY o.customer.userId")
    List<Object[]> aggregateCustomerOrderStats();
}
              