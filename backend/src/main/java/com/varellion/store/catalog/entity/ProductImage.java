package com.varellion.store.catalog.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity representing a product image in public.product_images.
 */
@Entity
@Table(name = "product_images", schema = "public")
@Getter
@Setter
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "image_id", nullable = false, updatable = false)
    private UUID imageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_main", nullable = false)
    private Boolean isMain = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public ProductImage() {
    }

    @Builder
    public ProductImage(UUID imageId, Product product, String imageUrl, Boolean isMain, Integer displayOrder, OffsetDateTime createdAt) {
        this.imageId = imageId;
        this.product = product;
        this.imageUrl = imageUrl;
        this.isMain = isMain != null ? isMain : false;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductImage that = (ProductImage) o;
        return imageId != null && Objects.equals(imageId, that.imageId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
