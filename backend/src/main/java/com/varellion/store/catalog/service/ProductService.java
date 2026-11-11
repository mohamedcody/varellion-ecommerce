package com.varellion.store.catalog.service;

import com.varellion.store.catalog.dto.PagedProductsResponse;
import com.varellion.store.catalog.dto.ProductDto;
import com.varellion.store.catalog.dto.ProductImageDto;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Service managing catalog products, real-time inventory calculation, and filtering.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * Retrieves a paginated and filtered list of active catalog products.
     */
    public PagedProductsResponse getProducts(String categorySlug, String search, String sortBy, int page, int size) {
        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = (size <= 0 || size > 100) ? 20 : size;

        Sort sort = resolveSort(sortBy);
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, sort);

        String cleanCategory = (categorySlug != null && !categorySlug.isBlank() && !categorySlug.equalsIgnoreCase("all"))
                ? categorySlug.trim()
                : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Product> pageResult = productRepository.findFilteredProducts(cleanCategory, cleanSearch, pageable);

        List<ProductDto> dtoList = pageResult.getContent().stream()
                .map(this::toDto)
                .toList();

        return new PagedProductsResponse(
                dtoList,
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.getNumber(),
                pageResult.getSize()
        );
    }

    /**
     * Resolves single product details by either UUID or SKU.
     */
    public ProductDto getProductByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResourceNotFoundException("معرف المنتج غير صالح");
        }

        String clean = identifier.trim();
        Product product = null;

        // 1. Try UUID parse
        try {
            UUID uuid = UUID.fromString(clean);
            product = productRepository.findByIdWithDetails(uuid).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, fallback to SKU lookup
        }

        // 2. Try SKU lookup if not resolved by UUID
        if (product == null) {
            product = productRepository.findBySkuWithDetails(clean)
                    .orElseThrow(() -> new ResourceNotFoundException("لم يتم العثور على المنتج المطلوب: " + clean));
        }

        return toDto(product);
    }

    /**
     * Retrieves top best-selling products for showcase widgets.
     */
    public List<ProductDto> getBestSellers(int limit) {
        int sanitizedLimit = (limit <= 0 || limit > 20) ? 4 : limit;
        Pageable pageable = PageRequest.of(0, sanitizedLimit);

        return productRepository.findBestSellers(pageable).stream()
                .map(this::toDto)
                .toList();
    }

    private Sort resolveSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy.toLowerCase().trim()) {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "bestseller" -> Sort.by(Sort.Direction.DESC, "reservedQuantity", "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    public ProductDto toDto(Product product) {
        int stock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int reserved = product.getReservedQuantity() != null ? product.getReservedQuantity() : 0;
        int available = Math.max(0, stock - reserved);

        List<ProductImageDto> imageDtos = (product.getImages() != null)
                ? product.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(img -> new ProductImageDto(img.getImageId(), img.getImageUrl(), img.getIsMain(), img.getDisplayOrder()))
                .toList()
                : List.of();

        return new ProductDto(
                product.getProductId(),
                product.getCategory() != null ? product.getCategory().getCategoryId() : null,
                product.getCategory() != null ? product.getCategory().getSlug() : null,
                product.getCategory() != null ? product.getCategory().getNameAr() : null,
                product.getCategory() != null ? product.getCategory().getNameEn() : null,
                product.getSku(),
                product.getNameAr(),
                product.getNameEn(),
                product.getDescriptionAr(),
                product.getDescriptionEn(),
                product.getPrice(),
                available,
                product.getIsActive(),
                imageDtos,
                product.getCreatedAt()
        );
    }
}
