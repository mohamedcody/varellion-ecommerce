package com.varellion.store.catalog.repository;

import com.varellion.store.catalog.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for public.product_images entity.
 */
@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    List<ProductImage> findByProduct_ProductIdOrderByDisplayOrderAsc(UUID productId);
}
