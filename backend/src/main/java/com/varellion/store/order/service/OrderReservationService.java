package com.varellion.store.order.service;

import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Service managing inventory reservations, confirmation deadlines, and automatic
 * expiration of overdue PENDING_CUSTOMER_CONFIRMATION orders (AUD-007).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderReservationService {

    private static final int EXPIRATION_BATCH_SIZE = 50;

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${varellion.store.reservation-hours:24}")
    private int reservationHours = 24;

    /**
     * Calculates the confirmation deadline for a newly created order based on configured reservation hours.
     */
    public OffsetDateTime calculateConfirmationDeadline() {
        int hours = reservationHours > 0 ? reservationHours : 24;
        return OffsetDateTime.now().plusHours(hours);
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

    /**
     * Scheduled reaper that expires overdue unconfirmed orders in bounded batches.
     * Each order is expired in its own isolated transaction via OrderService so one
     * optimistic-lock conflict or error never rolls back other expirations.
     */
    @Scheduled(fixedDelayString = "${varellion.store.reservation-expiry-check-ms:300000}")
    public int expireOverdueReservations() {
        OffsetDateTime now = OffsetDateTime.now();
        List<String> overdueOrderNumbers = orderRepository.findExpiredPendingConfirmationOrderNumbers(
                now, PageRequest.of(0, EXPIRATION_BATCH_SIZE)
        );
        if (overdueOrderNumbers.isEmpty()) {
            return 0;
        }

        int expiredCount = 0;
        for (String orderNumber : overdueOrderNumbers) {
            try {
                if (orderService.expireUnconfirmedOrder(orderNumber)) {
                    expiredCount++;
                }
            } catch (Exception ex) {
                log.warn("[OrderReservationService] Failed to expire overdue order {}: {}",
                        orderNumber, ex.getMessage());
            }
        }

        if (expiredCount > 0) {
            log.info("[OrderReservationService] Automatically expired {} overdue order(s) and released reserved stock",
                    expiredCount);
        }
        return expiredCount;
    }
}
