package com.varellion.store.order.entity;

/**
 * Valid shipping fee confirmation statuses as enforced by the database check constraint on public.orders.
 */
public enum ShippingFeeStatus {
    PENDING,
    CONFIRMED
}
