package com.varellion.store.order.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity representing an append-only audit record in public.order_status_history.
 * Tracks lifecycle state transitions, reason, and responsible actor.
 */
@Entity
@Table(name = "order_status_history", schema = "public")
@Getter
@Setter
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "history_id", nullable = false, updatable = false)
    private UUID historyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "previous_status", length = 50)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 50)
    private String newStatus;

    @Column(name = "reason")
    private String reason;

    @Column(name = "actor_id")
    private UUID actorId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public OrderStatusHistory() {
    }

    @Builder
    public OrderStatusHistory(UUID historyId, Order order, String previousStatus, String newStatus, String reason, UUID actorId, OffsetDateTime createdAt) {
        this.historyId = historyId;
        this.order = order;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.reason = reason;
        this.actorId = actorId;
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderStatusHistory that = (OrderStatusHistory) o;
        return historyId != null && Objects.equals(historyId, that.historyId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
