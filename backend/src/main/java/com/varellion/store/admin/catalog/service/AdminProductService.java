package com.varellion.store.admin.catalog.service;

import com.varellion.store.admin.catalog.dto.*;
import com.varellion.store.catalog.dto.ProductImageDto;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.order.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Service managing administrative catalog operations: CRUD, SKU uniqueness, and guarded archival.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Retrieves paginated products for admin overview with category, search, and active status filters.
     */
    @Transactional(readOnly = true)
    public PagedAdminProductsResponse getAdminProducts(
            String categorySlug,
            String search,
            Boolean isActive,
            int page,
            int limit
    ) {
        return getAdminProducts(categorySlug, search, isActive, page, limit, "createdAt", "DESC");
    }

    /**
     * Retrieves paginated products for admin overview with category, search, active status filters, and dynamic sorting.
     */
    @Transactional(readOnly = true)
    public PagedAdminProductsResponse getAdminProducts(
            String categorySlug,
            String search,
            Boolean isActive,
            int page,
            int limit,
            String sortBy,
            String sortDirection
    ) {
        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = (limit <= 0 || limit > 100) ? 20 : limit;

        String sortProperty = switch (sortBy != null ? sortBy.trim() : "") {
            case "price" -> "price";
            case "stockQuantity" -> "stockQuantity";
            case "nameAr" -> "nameAr";
            default -> "createdAt";
        };
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortProperty);

        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, sort);

        String cleanCategory = (categorySlug != null && !categorySlug.isBlank() && !categorySlug.equalsIgnoreCase("all"))
                ? categorySlug.trim()
                : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Product> pageResult = productRepository.findAdminProducts(cleanCategory, cleanSearch, isActive, pageable);

        List<AdminProductDto> dtoList = pageResult.getContent().stream()
                .map(this::toAdminDto)
                .toList();

        return PagedAdminProductsResponse.builder()
                .products(dtoList)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .currentPage(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .build();
    }

    /**
     * Retrieves detailed administrative product view by UUID.
     */
    @Transactional(readOnly = true)
    public AdminProductDto getAdminProductById(UUID productId) {
        Product product = productRepository.findByIdWithDetailsAdmin(productId)
                .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + productId));
        return toAdminDto(product);
    }

    /**
     * Creates a new luxury product with inventory and image gallery.
     */
    @Transactional
    public AdminProductDto createProduct(CreateProductRequest request) {
        log.info("Creating new product with SKU: {}", request.getSku());

        // 1. Verify SKU uniqueness
        if (productRepository.existsBySkuIgnoreCase(request.getSku().trim())) {
            throw new BusinessException("رمز المنتج (SKU) '" + request.getSku().trim() + "' مسجل بالفعل لمنتج آخر", HttpStatus.CONFLICT);
        }

        // Validate active price constraint
        if (Boolean.TRUE.equals(request.getIsActive()) && (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("لا يمكن تفعيل منتج بسعر صفر أو أقل", HttpStatus.BAD_REQUEST);
        }

        // 2. Resolve Category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("القسم المختار غير موجود"));

        // 3. Build Product Entity
        Product product = Product.builder()
                .nameAr(request.getNameAr().trim())
                .nameEn(request.getNameEn().trim())
                .category(category)
                .descriptionAr(request.getDescriptionAr())
                .descriptionEn(request.getDescriptionEn())
                .price(request.getPrice())
                .costPrice(request.getCostPrice())
                .stockQuantity(request.getStockQuantity())
                .reservedQuantity(0)
                .sku(request.getSku().trim().toUpperCase())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .images(new ArrayList<>())
                .build();

        // 4. Attach Images
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (CreateProductRequest.ProductImageInputDto imgDto : request.getImages()) {
                ProductImage image = ProductImage.builder()
                        .product(product)
                        .imageUrl(imgDto.getImageUrl().trim())
                        .isMain(imgDto.getIsMain() != null ? imgDto.getIsMain() : false)
                        .displayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0)
                        .build();
                product.getImages().add(image);
            }
        }

        Product saved = productRepository.save(product);
        log.info("Successfully created product with ID: {} and SKU: {}", saved.getProductId(), saved.getSku());
        return toAdminDto(saved);
    }

    /**
     * Updates an existing product's metadata, pricing, stock, and media gallery.
     */
    @Transactional
    public AdminProductDto updateProduct(UUID productId, UpdateProductRequest request) {
        log.info("Updating product ID: {}", productId);

        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + productId));

        // 1. Verify SKU uniqueness if changed
        String cleanSku = request.getSku().trim().toUpperCase();
        if ((product.getSku() == null || !product.getSku().equalsIgnoreCase(cleanSku))
                && productRepository.existsBySkuIgnoreCase(cleanSku)) {
            throw new BusinessException("رمز المنتج (SKU) '" + cleanSku + "' مسجل بالفعل لمنتج آخر", HttpStatus.CONFLICT);
        }

        // Validate active price constraint
        boolean targetActive = request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE.equals(product.getIsActive());
        BigDecimal targetPrice = request.getPrice() != null ? request.getPrice() : product.getPrice();
        if (targetActive && (targetPrice == null || targetPrice.compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("لا يمكن تفعيل منتج بسعر صفر أو أقل", HttpStatus.BAD_REQUEST);
        }

        // Validate stock not less than reserved
        int reserved = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
        if (request.getStockQuantity() != null && request.getStockQuantity() < reserved) {
            throw new BusinessException("لا يمكن تقليل كمية المخزون عن الكمية المحجوزة للطلبات الحالية", HttpStatus.BAD_REQUEST);
        }

        // 2. Resolve Category if changed
        if (!product.getCategory().getCategoryId().equals(request.getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("القسم المختار غير موجود"));
            product.setCategory(category);
        }

        // 3. Update attributes
        product.setNameAr(request.getNameAr().trim());
        product.setNameEn(request.getNameEn().trim());
        product.setDescriptionAr(request.getDescriptionAr());
        product.setDescriptionEn(request.getDescriptionEn());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setSku(cleanSku);
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        // 4. Update Images: preserve existing images if request.getImages() is null
        if (request.getImages() != null) {
            product.getImages().clear();
            if (!request.getImages().isEmpty()) {
                for (CreateProductRequest.ProductImageInputDto imgDto : request.getImages()) {
                    ProductImage image = ProductImage.builder()
                            .product(product)
                            .imageUrl(imgDto.getImageUrl().trim())
                            .isMain(imgDto.getIsMain() != null ? imgDto.getIsMain() : false)
                            .displayOrder(imgDto.getDisplayOrder() != null ? imgDto.getDisplayOrder() : 0)
                            .build();
                    product.getImages().add(image);
                }
            }
        }

        Product updated = productRepository.save(product);
        log.info("Successfully updated product ID: {}", updated.getProductId());
        return toAdminDto(updated);
    }

    /**
     * Toggles a product's active visibility in the storefront.
     */
    @Transactional
    public AdminProductDto toggleProductStatus(UUID productId, boolean isActive) {
        log.info("Toggling product ID: {} status to: {}", productId, isActive);

        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + productId));

        if (isActive && (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("لا يمكن تفعيل منتج بسعر صفر أو أقل", HttpStatus.BAD_REQUEST);
        }

        product.setIsActive(isActive);
        Product saved = productRepository.save(product);
        return toAdminDto(saved);
    }

    /**
     * Deletes or archives a product. If the product has past orders, it is automatically soft-deleted.
     */
    @Transactional
    public String deleteProduct(UUID productId) {
        log.info("Attempting deletion of product ID: {}", productId);

        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + productId));

        boolean hasOrderHistory = orderItemRepository.existsByProductId(productId);

        if (hasOrderHistory) {
            product.setIsActive(false);
            productRepository.save(product);
            log.info("Product ID: {} has order history. Soft-deleted / archived successfully.", productId);
            return "تم أرشفة المنتج بنجاح وإلغاء تفعيله للحفاظ على سلامة سجلات الطلبات التاريخية";
        } else {
            productRepository.delete(product);
            log.info("Product ID: {} has no order history. Permanently deleted.", productId);
            return "تم حذف المنتج نهائياً بنجاح";
        }
    }

    public AdminProductDto toAdminDto(Product product) {
        int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int reserved = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
        int available = Math.max(0, stock - reserved);

        List<ProductImageDto> imageDtos = (product.getImages() != null)
                ? product.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(img -> new ProductImageDto(img.getImageId(), img.getImageUrl(), img.getIsMain(), img.getDisplayOrder()))
                .toList()
                : List.of();

        return AdminProductDto.builder()
                .productId(product.getProductId())
                .categoryId(product.getCategory() != null ? product.getCategory().getCategoryId() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .categoryNameAr(product.getCategory() != null ? product.getCategory().getNameAr() : null)
                .categoryNameEn(product.getCategory() != null ? product.getCategory().getNameEn() : null)
                .sku(product.getSku())
                .nameAr(product.getNameAr())
                .nameEn(product.getNameEn())
                .descriptionAr(product.getDescriptionAr())
                .descriptionEn(product.getDescriptionEn())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .stockQuantity(stock)
                .reservedQuantity(reserved)
                .availableStock(available)
                .isActive(product.getIsActive())
                .images(imageDtos)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
