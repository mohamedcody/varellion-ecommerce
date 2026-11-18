package com.varellion.store.admin.catalog.service;

import com.varellion.store.admin.catalog.dto.AdminCategoryDto;
import com.varellion.store.admin.catalog.dto.CreateCategoryRequest;
import com.varellion.store.admin.catalog.dto.UpdateCategoryRequest;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Lists all categories with aggregated product counts.
     */
    @Transactional(readOnly = true)
    public List<AdminCategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();

        Map<UUID, Long> productCounts = new HashMap<>();
        List<Object[]> rows = categoryRepository.countAllProductsGroupedByCategory();
        if (rows != null) {
            for (Object[] row : rows) {
                if (row[0] instanceof UUID catId && row[1] instanceof Number cnt) {
                    productCounts.put(catId, cnt.longValue());
                }
            }
        }

        return categories.stream()
                .sorted(Comparator.comparing(Category::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(cat -> toDto(cat, productCounts.getOrDefault(cat.getCategoryId(), 0L)))
                .toList();
    }

    /**
     * Retrieves category by ID.
     */
    @Transactional(readOnly = true)
    public AdminCategoryDto getCategoryById(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("القسم المطلوب غير موجود: " + categoryId));

        long productCount = categoryRepository.countAllProductsByCategoryId(categoryId);
        return toDto(category, productCount);
    }

    /**
     * Creates a new product category.
     */
    @Transactional
    public AdminCategoryDto createCategory(CreateCategoryRequest request) {
        String cleanSlug = request.getSlug().trim().toLowerCase();

        if (categoryRepository.existsBySlugIgnoreCase(cleanSlug)) {
            throw new BusinessException("الرابط الدائم (slug) '" + cleanSlug + "' مستخدم بالفعل لقسم آخر", HttpStatus.CONFLICT);
        }

        Category category = Category.builder()
                .nameAr(request.getNameAr().trim())
                .nameEn(request.getNameEn().trim())
                .slug(cleanSlug)
                .descriptionAr(request.getDescriptionAr())
                .descriptionEn(request.getDescriptionEn())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created new category ID: {} with slug: {}", saved.getCategoryId(), saved.getSlug());
        return toDto(saved, 0L);
    }

    /**
     * Updates an existing category's metadata.
     */
    @Transactional
    public AdminCategoryDto updateCategory(UUID categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("القسم المطلوب غير موجود: " + categoryId));

        String cleanSlug = request.getSlug().trim().toLowerCase();
        if (!category.getSlug().equalsIgnoreCase(cleanSlug) && categoryRepository.existsBySlugIgnoreCase(cleanSlug)) {
            throw new BusinessException("الرابط الدائم (slug) '" + cleanSlug + "' مستخدم بالفعل لقسم آخر", HttpStatus.CONFLICT);
        }

        category.setNameAr(request.getNameAr().trim());
        category.setNameEn(request.getNameEn().trim());
        category.setSlug(cleanSlug);
        category.setDescriptionAr(request.getDescriptionAr());
        category.setDescriptionEn(request.getDescriptionEn());
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        Category saved = categoryRepository.save(category);
        long productCount = categoryRepository.countAllProductsByCategoryId(categoryId);
        log.info("Updated category ID: {}", saved.getCategoryId());
        return toDto(saved, productCount);
    }

    /**
     * Toggles category active status.
     */
    @Transactional
    public AdminCategoryDto toggleCategoryStatus(UUID categoryId, boolean isActive) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("القسم المطلوب غير موجود: " + categoryId));

        category.setIsActive(isActive);
        Category saved = categoryRepository.save(category);
        long productCount = categoryRepository.countAllProductsByCategoryId(categoryId);
        return toDto(saved, productCount);
    }

    /**
     * Deletes a category if it contains no products.
     */
    @Transactional
    public String deleteCategory(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("القسم المطلوب غير موجود: " + categoryId));

        long count = categoryRepository.countAllProductsByCategoryId(categoryId);
        if (count > 0) {
            throw new BusinessException(
                    "لا يمكن حذف قسم يحتوي على " + count + " منتج(ات) مرتبطة به. يرجى نقل أو حذف المنتجات أولاً.",
                    HttpStatus.CONFLICT
            );
        }

        categoryRepository.delete(category);
        log.info("Successfully deleted empty category ID: {}", categoryId);
        return "تم حذف القسم بنجاح";
    }

    private AdminCategoryDto toDto(Category category, long productCount) {
        return AdminCategoryDto.builder()
                .categoryId(category.getCategoryId())
                .nameAr(category.getNameAr())
                .nameEn(category.getNameEn())
                .slug(category.getSlug())
                .descriptionAr(category.getDescriptionAr())
                .descriptionEn(category.getDescriptionEn())
                .isActive(category.getIsActive())
                .productCount(productCount)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
