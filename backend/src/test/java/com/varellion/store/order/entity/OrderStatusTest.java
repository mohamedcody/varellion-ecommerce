package com.varellion.store.order.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {

    private static final Map<OrderStatus, Set<OrderStatus>> EXPECTED_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        EXPECTED_TRANSITIONS.put(
                OrderStatus.PENDING_CUSTOMER_CONFIRMATION,
                EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.EXPIRED)
        );
        EXPECTED_TRANSITIONS.put(
                OrderStatus.CONFIRMED,
                EnumSet.of(OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.CANCELLED)
        );
        EXPECTED_TRANSITIONS.put(
                OrderStatus.PREPARING,
                EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED)
        );
        EXPECTED_TRANSITIONS.put(
                OrderStatus.SHIPPED,
                EnumSet.of(OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED, OrderStatus.RETURNED, OrderStatus.CANCELLED)
        );
        EXPECTED_TRANSITIONS.put(
                OrderStatus.DELIVERY_FAILED,
                EnumSet.of(OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.CANCELLED)
        );
        EXPECTED_TRANSITIONS.put(OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class));
        EXPECTED_TRANSITIONS.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        EXPECTED_TRANSITIONS.put(OrderStatus.EXPIRED, EnumSet.noneOf(OrderStatus.class));
        EXPECTED_TRANSITIONS.put(OrderStatus.RETURNED, EnumSet.noneOf(OrderStatus.class));
        EXPECTED_TRANSITIONS.put(OrderStatus.EXCHANGED, EnumSet.noneOf(OrderStatus.class));
    }

    @Test
    @DisplayName("Complete 10x10 transition matrix matches expected valid and invalid transitions")
    void canTransitionTo_FullMatrixMatchesContract() {
        assertThat(OrderStatus.values()).hasSize(10);
        assertThat(EXPECTED_TRANSITIONS.keySet()).containsExactlyInAnyOrder(OrderStatus.values());

        for (OrderStatus from : OrderStatus.values()) {
            Set<OrderStatus> allowedTargets = EXPECTED_TRANSITIONS.get(from);
            for (OrderStatus to : OrderStatus.values()) {
                boolean expected = allowedTargets.contains(to);
                assertThat(from.canTransitionTo(to))
                        .as("Transition %s -> %s", from, to)
                        .isEqualTo(expected);
            }
        }
    }

    @Test
    @DisplayName("Same-state and null transitions are rejected for every OrderStatus")
    void canTransitionTo_SameStateAndNull_AlwaysFalse() {
        for (OrderStatus status : OrderStatus.values()) {
            assertThat(status.canTransitionTo(status))
                    .as("Self-transition %s -> %s", status, status)
                    .isFalse();
            assertThat(status.canTransitionTo(null))
                    .as("Null transition %s -> null", status)
                    .isFalse();
        }
    }

    @Test
    @DisplayName("Terminal states cannot transition to any other status")
    void canTransitionTo_TerminalStates_BlockAllTargets() {
        Set<OrderStatus> terminalStates = EnumSet.of(
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
                OrderStatus.EXPIRED,
                OrderStatus.RETURNED,
                OrderStatus.EXCHANGED
        );

        for (OrderStatus terminal : terminalStates) {
            for (OrderStatus target : OrderStatus.values()) {
                assertThat(terminal.canTransitionTo(target))
                        .as("Terminal state %s -> %s", terminal, target)
                        .isFalse();
            }
        }
    }

    @Test
    @DisplayName("Pre-shipment states cannot skip directly to DELIVERED")
    void canTransitionTo_PreShipmentToDelivered_AlwaysFalse() {
        Set<OrderStatus> preShipmentStates = EnumSet.of(
                OrderStatus.PENDING_CUSTOMER_CONFIRMATION,
                OrderStatus.CONFIRMED,
                OrderStatus.PREPARING
        );

        for (OrderStatus preShipment : preShipmentStates) {
            assertThat(preShipment.canTransitionTo(OrderStatus.DELIVERED))
                    .as("Pre-shipment direct delivery %s -> DELIVERED", preShipment)
                    .isFalse();
        }
    }

    @Test
    @DisplayName("EXCHANGED currently has zero inbound transitions (unreachable dead state)")
    void canTransitionTo_Exchanged_IsCurrentlyUnreachable() {
        for (OrderStatus source : OrderStatus.values()) {
            assertThat(source.canTransitionTo(OrderStatus.EXCHANGED))
                    .as("Inbound transition %s -> EXCHANGED", source)
                    .isFalse();
        }
    }
}
