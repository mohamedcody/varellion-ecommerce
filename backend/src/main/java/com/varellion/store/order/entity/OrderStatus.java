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
    EXCHANGED;

    /**
     * Determines whether transitioning from this status to the given target status is valid.
     * Prevents transitions from terminal states (DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED),
     * self-transitions (handled via idempotency), and illogical backward transitions.
     *
     * @param nextStatus The intended target status
     * @return true if the transition is logically permissible; false otherwise
     */
    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (nextStatus == null || nextStatus == this) {
            return false;
        }

        return switch (this) {
            case PENDING_CUSTOMER_CONFIRMATION ->
                    nextStatus == CONFIRMED || nextStatus == CANCELLED || nextStatus == EXPIRED;

            case CONFIRMED ->
                    nextStatus == PREPARING || nextStatus == SHIPPED || nextStatus == CANCELLED;

            case PREPARING ->
                    nextStatus == SHIPPED || nextStatus == CANCELLED;

            case SHIPPED ->
                    nextStatus == DELIVERED || nextStatus == DELIVERY_FAILED
                            || nextStatus == RETURNED || nextStatus == CANCELLED;

            case DELIVERY_FAILED ->
                    nextStatus == SHIPPED || nextStatus == DELIVERED
                            || nextStatus == RETURNED || nextStatus == CANCELLED;

            // Terminal states cannot transition to any other status
            case DELIVERED, CANCELLED, EXPIRED, RETURNED, EXCHANGED -> false;
        };
    }
}

