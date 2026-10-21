package com.varellion.store.order.entity;

import com.varellion.store.catalog.entity.Product;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity representing an individual line item in public.order_items.
 * Preserves immutable catalog and financial snapshots at time of purchase.
 */
@Entity
@Table(
    name = "order_items",
    schema = "public",
    uniqueConstraints = @UniqueConstraint(name = "uq_order_product", columnNames = {"order_id", "product_id"})
)
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_item_id", nullable = false, updatable = false)
    private UUID orderItemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name_ar", nullable = false)
    private String productNameAr;

    @Column(name = "product_name_en", nullable = false)
    private String productNameEn;

    @Column(name = "sku", nullable = false, length = 100)
    private String sku;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public OrderItem() {
    }

    @Builder
    public OrderItem(UUID orderItemId, Order order, Product product, String productNameAr, String productNameEn, String sku, BigDecimal unitPrice, BigDecimal unitCost, Integer quantity, BigDecimal lineTotal, OffsetDateTime createdAt) {
        this.orderItemId = orderItemId;
        this.order = order;
        this.product = product;
        this.productNameAr = productNameAr;
        this.productNameEn = productNameEn;
        this.sku = sku;
        this.unitPrice = unitPrice;
        this.unitCost = unitCost != null ? unitCost : BigDecimal.ZERO;
        this.quantity = quantity;
        this.lineTotal = lineTotal;
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderItem orderItem = (OrderItem) o;
        return orderItemId != null && Objects.equals(orderItemId, orderItem.orderItemId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
