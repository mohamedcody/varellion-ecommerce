package com.varellion.store.catalog;

import com.varellion.store.catalog.dto.PagedProductsResponse;
import com.varellion.store.catalog.dto.ProductDto;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.catalog.service.ProductService;
import com.varellion.store.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Category testCategory;
    private Product testProduct;
    private UUID productId;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder()
                .categoryId(UUID.randomUUID())
                .nameAr("الساعات الفاخرة")
                .nameEn("Luxury Watches")
                .slug("watches")
                .isActive(true)
                .build();

        productId = UUID.randomUUID();
        testProduct = Product.builder()
                .productId(productId)
                .category(testCategory)
                .nameAr("ساعة كرونوغراف")
                .nameEn("Chronograph Watch")
                .sku("VAR-W-01")
                .price(new BigDecimal("1850.00"))
                .costPrice(new BigDecimal("950.00"))
                .stockQuantity(15)
                .reservedQuantity(3)
                .isActive(true)
                .images(new ArrayList<>())
                .createdAt(OffsetDateTime.now())
                .build();

        ProductImage img = ProductImage.builder()
                .imageId(UUID.randomUUID())
                .product(testProduct)
                .imageUrl("https://images.example.com/watch.jpg")
                .isMain(true)
                .displayOrder(1)
                .build();
        testProduct.getImages().add(img);
    }

    @Test
    @DisplayName("Should return paginated and filtered products")
    void shouldReturnPaginatedProducts() {
        Page<Product> productPage = new PageImpl<>(List.of(testProduct));
        when(productRepository.findFilteredProducts(eq("watches"), eq("كرونوغراف"), any(Pageable.class)))
                .thenReturn(productPage);

        PagedProductsResponse response = productService.getProducts("watches", "كرونوغراف", "price-asc", 0, 10);

        assertThat(response.products()).hasSize(1);
        ProductDto dto = response.products().get(0);
        assertThat(dto.sku()).isEqualTo("VAR-W-01");
        assertThat(dto.availableStock()).isEqualTo(12); // 15 - 3
        assertThat(dto.categorySlug()).isEqualTo("watches");
        assertThat(dto.images()).hasSize(1);
        assertThat(dto.images().get(0).isMain()).isTrue();
    }

    @Test
    @DisplayName("Should find product by UUID")
    void shouldFindProductByUuid() {
        when(productRepository.findByIdWithDetails(productId))
                .thenReturn(Optional.of(testProduct));

        ProductDto dto = productService.getProductByIdentifier(productId.toString());

        assertThat(dto).isNotNull();
        assertThat(dto.productId()).isEqualTo(productId);
        assertThat(dto.nameAr()).isEqualTo("ساعة كرونوغراف");
    }

    @Test
    @DisplayName("Should find product by SKU when identifier is not a UUID")
    void shouldFindProductBySku() {
        when(productRepository.findBySkuWithDetails("VAR-W-01"))
                .thenReturn(Optional.of(testProduct));

        ProductDto dto = productService.getProductByIdentifier("VAR-W-01");

        assertThat(dto).isNotNull();
        assertThat(dto.sku()).isEqualTo("VAR-W-01");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when product not found")
    void shouldThrowExceptionWhenNotFound() {
        when(productRepository.findBySkuWithDetails("UNKNOWN-SKU"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductByIdentifier("UNKNOWN-SKU"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("UNKNOWN-SKU");
    }

    @Test
    @DisplayName("Should return best sellers")
    void shouldReturnBestSellers() {
        when(productRepository.findBestSellers(any(Pageable.class)))
                .thenReturn(List.of(testProduct));

        List<ProductDto> bestSellers = productService.getBestSellers(4);

        assertThat(bestSellers).hasSize(1);
        assertThat(bestSellers.get(0).sku()).isEqualTo("VAR-W-01");
    }
}
