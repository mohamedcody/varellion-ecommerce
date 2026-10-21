package com.varellion.store.order.entity;

/**
 * Valid order lifecycle statuses as enforced by the database check constraint on public.orders.
 */
public enum OrderStatus {
    PENDING_CUSTOMER_CONFIRMATION,
    CONFIRMED,
    PREPARING,
    SHIPPED,
    DELIVERED,
    DELIVERY_FAILED,
    CANCELLED,
    EXPIRED,
    RETURNED,
    EXCHANGED
}
