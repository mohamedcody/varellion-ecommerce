package com.varellion.store.catalog.repository;

import com.varellion.store.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for public.categories entity.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByIsActiveTrueOrderByCreatedAtAsc();

    Optional<Category> findBySlugAndIsActiveTrue(String slug);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.categoryId = :categoryId AND p.isActive = true")
    long countActiveProductsByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("SELECT p.category.categoryId, COUNT(p) FROM Product p WHERE p.isActive = true GROUP BY p.category.categoryId")
    List<Object[]> countActiveProductsGroupedByCategory();
}
