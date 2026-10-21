package com.varellion.store.order.entity;

import com.varellion.store.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity representing master order record in public.orders.
 * Includes immutable customer, address, financial snapshots, and lifecycle status.
 */
@Entity
@Table(name = "orders", schema = "public")
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Column(name = "order_number", nullable = false, unique = true, length = 32)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 30)
    private String customerPhone;

    @Column(name = "shipping_governorate", nullable = false, length = 100)
    private String shippingGovernorate;

    @Column(name = "shipping_city_area", nullable = false, length = 100)
    private String shippingCityArea;

    @Column(name = "shipping_detailed_address", nullable = false)
    private String shippingDetailedAddress;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "EGP";

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", precision = 10, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 50)
    private OrderStatus orderStatus = OrderStatus.PENDING_CUSTOMER_CONFIRMATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_fee_status", nullable = false, length = 30)
    private ShippingFeeStatus shippingFeeStatus = ShippingFeeStatus.PENDING;

    @Column(name = "confirmation_deadline")
    private OffsetDateTime confirmationDeadline;

    @Column(name = "customer_notes")
    private String customerNotes;

    @Column(name = "admin_notes")
    private String adminNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    public Order() {
    }

    @Builder
    public Order(UUID orderId, String orderNumber, Customer customer, String customerName, String customerPhone, String shippingGovernorate, String shippingCityArea, String shippingDetailedAddress, String currency, BigDecimal subtotal, BigDecimal discountTotal, BigDecimal shippingFee, BigDecimal totalAmount, OrderStatus orderStatus, ShippingFeeStatus shippingFeeStatus, OffsetDateTime confirmationDeadline, String customerNotes, String adminNotes, OffsetDateTime createdAt, OffsetDateTime updatedAt, List<OrderItem> items, List<OrderStatusHistory> statusHistory) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customer = customer;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.shippingGovernorate = shippingGovernorate;
        this.shippingCityArea = shippingCityArea;
        this.shippingDetailedAddress = shippingDetailedAddress;
        this.currency = currency != null ? currency : "EGP";
        this.subtotal = subtotal;
        this.discountTotal = discountTotal != null ? discountTotal : BigDecimal.ZERO;
        this.shippingFee = shippingFee;
        this.totalAmount = totalAmount;
        this.orderStatus = orderStatus != null ? orderStatus : OrderStatus.PENDING_CUSTOMER_CONFIRMATION;
        this.shippingFeeStatus = shippingFeeStatus != null ? shippingFeeStatus : ShippingFeeStatus.PENDING;
        this.confirmationDeadline = confirmationDeadline;
        this.customerNotes = customerNotes;
        this.adminNotes = adminNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.items = items != null ? items : new ArrayList<>();
        this.statusHistory = statusHistory != null ? statusHistory : new ArrayList<>();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order order = (Order) o;
        return orderId != null && Objects.equals(orderId, order.orderId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
