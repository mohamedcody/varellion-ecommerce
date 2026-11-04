package com.varellion.store.order.service;

import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Service managing inventory reservations and confirmation deadlines for orders.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderReservationService {

    private final OrderRepository orderRepository;

    /**
     * Sets a standard 24-hour reservation window for a newly created order.
     */
    public OffsetDateTime calculateConfirmationDeadline() {
        return OffsetDateTime.now().plusHours(24);
    }

    /**
     * Checks whether an order's reservation deadline has expired.
     */
    public boolean isReservationExpired(Order order) {
        if (order == null || order.getConfirmationDeadline() == null) {
            return false;
        }
        return order.getOrderStatus() == OrderStatus.PENDING_CUSTOMER_CONFIRMATION
                && OffsetDateTime.now().isAfter(order.getConfirmationDeadline());
    }
}
