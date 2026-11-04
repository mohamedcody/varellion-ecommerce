package com.varellion.store.catalog.repository;

import com.varellion.store.catalog.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for public.products entity.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByProductId(UUID productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :productId")
    Optional<Product> findByIdForUpdate(@Param("productId") UUID productId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.images WHERE p.productId = :productId AND p.isActive = true")
    Optional<Product> findByIdWithDetails(@Param("productId") UUID productId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.images WHERE LOWER(p.sku) = LOWER(:sku) AND p.isActive = true")
    Optional<Product> findBySkuWithDetails(@Param("sku") String sku);

    @Query(value = """
        SELECT p FROM Product p
        JOIN FETCH p.category c
        WHERE p.isActive = true
          AND (CAST(:categorySlug AS string) IS NULL OR c.slug = :categorySlug)
          AND (CAST(:search AS string) IS NULL OR (
               LOWER(p.nameAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.nameEn) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.sku) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.descriptionAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')
          ))
    """,
    countQuery = """
        SELECT COUNT(p) FROM Product p
        JOIN p.category c
        WHERE p.isActive = true
          AND (CAST(:categorySlug AS string) IS NULL OR c.slug = :categorySlug)
          AND (CAST(:search AS string) IS NULL OR (
               LOWER(p.nameAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.nameEn) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.sku) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
               LOWER(p.descriptionAr) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%')
          ))
    """)
    Page<Product> findFilteredProducts(
            @Param("categorySlug") String categorySlug,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.category
        WHERE p.isActive = true
        ORDER BY p.reservedQuantity DESC, p.createdAt DESC
    """)
    List<Product> findBestSellers(Pageable pageable);
}
