package com.varellion.store.catalog.entity;

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
 * JPA Entity representing a commercial catalog product in public.products.
 * Includes inventory fields (cost_price, stock_quantity, reserved_quantity, sku) per V3 migration.
 */
@Entity
@Table(name = "products", schema = "public")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "name_ar", nullable = false)
    private String nameAr;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "description_ar")
    private String descriptionAr;

    @Column(name = "description_en")
    private String descriptionEn;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "cost_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    public Product() {
    }

    @Builder
    public Product(UUID productId, Category category, String nameAr, String nameEn, String descriptionAr, String descriptionEn, BigDecimal price, BigDecimal costPrice, Integer stockQuantity, Integer reservedQuantity, String sku, Boolean isActive, OffsetDateTime createdAt, OffsetDateTime updatedAt, List<ProductImage> images) {
        this.productId = productId;
        this.category = category;
        this.nameAr = nameAr;
        this.nameEn = nameEn;
        this.descriptionAr = descriptionAr;
        this.descriptionEn = descriptionEn;
        this.price = price != null ? price : BigDecimal.ZERO;
        this.costPrice = costPrice != null ? costPrice : BigDecimal.ZERO;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.reservedQuantity = reservedQuantity != null ? reservedQuantity : 0;
        this.sku = sku;
        this.isActive = isActive != null ? isActive : false;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.images = images != null ? images : new ArrayList<>();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return productId != null && Objects.equals(productId, product.productId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
