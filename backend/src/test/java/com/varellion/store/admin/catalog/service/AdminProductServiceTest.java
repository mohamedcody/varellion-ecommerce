package com.varellion.store.admin.catalog.service;

import com.varellion.store.admin.catalog.dto.AdminProductDto;
import com.varellion.store.admin.catalog.dto.CreateProductRequest;
import com.varellion.store.admin.catalog.dto.PagedAdminProductsResponse;
import com.varellion.store.admin.catalog.dto.UpdateProductRequest;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.order.repository.OrderItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private AdminProductService adminProductService;

    private Category sampleCategory;
    private Product sampleProduct;
    private UUID productId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        productId = UUID.randomUUID();

        sampleCategory = Category.builder()
                .categoryId(categoryId)
                .nameAr("ساعات يد")
                .nameEn("Watches")
                .slug("luxury-watches")
                .isActive(true)
                .build();

        sampleProduct = Product.builder()
                .productId(productId)
                .category(sampleCategory)
                .nameAr("ساعة ملكية فاخرة")
                .nameEn("Royal Luxury Watch")
                .descriptionAr("وصف عربي")
                .descriptionEn("English description")
                .sku("VAR-WAT-001")
                .price(new BigDecimal("5000.00"))
                .costPrice(new BigDecimal("2500.00"))
                .stockQuantity(10)
                .reservedQuantity(2)
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .images(new ArrayList<>())
                .build();

        sampleProduct.getImages().add(ProductImage.builder()
                .product(sampleProduct)
                .imageId(UUID.randomUUID())
                .imageUrl("https://varellion.com/img1.jpg")
                .isMain(true)
                .displayOrder(0)
                .build());
    }

    @Test
    @DisplayName("getAdminProducts: Returns paged response with mapped DTOs")
    void getAdminProducts_ReturnsPagedDto() {
        Page<Product> pagedResult = new PageImpl<>(List.of(sampleProduct));
        when(productRepository.findAdminProducts(eq("luxury-watches"), eq("ساعة"), eq(true), any(Pageable.class)))
                .thenReturn(pagedResult);

        PagedAdminProductsResponse response = adminProductService.getAdminProducts(
                "luxury-watches", "ساعة", true, 0, 10, "price", "ASC"
        );

        assertThat(response).isNotNull();
        assertThat(response.getProducts()).hasSize(1);
        assertThat(response.getProducts().get(0).getSku()).isEqualTo("VAR-WAT-001");
        assertThat(response.getProducts().get(0).getAvailableStock()).isEqualTo(8); // 10 - 2
    }

    @Test
    @DisplayName("getAdminProductById: Returns DTO when product exists")
    void getAdminProductById_Success() {
        when(productRepository.findByIdWithDetailsAdmin(productId)).thenReturn(Optional.of(sampleProduct));

        AdminProductDto dto = adminProductService.getAdminProductById(productId);

        assertThat(dto).isNotNull();
        assertThat(dto.getProductId()).isEqualTo(productId);
        assertThat(dto.getCategoryNameAr()).isEqualTo("ساعات يد");
    }

    @Test
    @DisplayName("getAdminProductById: Throws ResourceNotFoundException when product does not exist")
    void getAdminProductById_NotFound() {
        when(productRepository.findByIdWithDetailsAdmin(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminProductService.getAdminProductById(productId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("المنتج المطلوب غير موجود");
    }

    @Test
    @DisplayName("createProduct: Successfully creates product with images")
    void createProduct_Success() {
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(categoryId)
                .nameAr("ساعة جديدة")
                .nameEn("New Watch")
                .sku("VAR-NEW-001")
                .price(new BigDecimal("4000.00"))
                .costPrice(new BigDecimal("2000.00"))
                .stockQuantity(15)
                .isActive(true)
                .images(List.of(new CreateProductRequest.ProductImageInputDto("https://varellion.com/new.jpg", true, 0)))
                .build();

        when(productRepository.existsBySkuIgnoreCase("VAR-NEW-001")).thenReturn(false);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setProductId(UUID.randomUUID());
            return p;
        });

        AdminProductDto created = adminProductService.createProduct(request);

        assertThat(created).isNotNull();
        assertThat(created.getSku()).isEqualTo("VAR-NEW-001");
        assertThat(created.getImages()).hasSize(1);
    }

    @Test
    @DisplayName("createProduct: Throws BusinessException 409 when SKU already exists")
    void createProduct_DuplicateSku() {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("VAR-WAT-001")
                .build();

        when(productRepository.existsBySkuIgnoreCase("VAR-WAT-001")).thenReturn(true);

        assertThatThrownBy(() -> adminProductService.createProduct(request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("مسجل بالفعل لمنتج آخر");
    }

    @Test
    @DisplayName("createProduct: Throws BusinessException 400 when active product has zero price")
    void createProduct_ActiveZeroPrice() {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("VAR-ZERO-001")
                .price(BigDecimal.ZERO)
                .isActive(true)
                .build();

        when(productRepository.existsBySkuIgnoreCase("VAR-ZERO-001")).thenReturn(false);

        assertThatThrownBy(() -> adminProductService.createProduct(request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
                .hasMessageContaining("لا يمكن تفعيل منتج بسعر صفر أو أقل");
    }

    @Test
    @DisplayName("createProduct: Throws ResourceNotFoundException when category not found")
    void createProduct_CategoryNotFound() {
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(categoryId)
                .sku("VAR-NEW-002")
                .price(new BigDecimal("100.00"))
                .isActive(true)
                .nameAr("اسم عربي")
                .nameEn("English Name")
                .build();

        when(productRepository.existsBySkuIgnoreCase("VAR-NEW-002")).thenReturn(false);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminProductService.createProduct(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("القسم المختار غير موجود");
    }

    @Test
    @DisplayName("updateProduct: Successfully updates product metadata and preserves existing images when images is null")
    void updateProduct_PreservesImagesWhenNull() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .categoryId(categoryId)
                .nameAr("ساعة محدثة")
                .nameEn("Updated Watch")
                .sku("VAR-WAT-001")
                .price(new BigDecimal("5500.00"))
                .stockQuantity(15)
                .isActive(true)
                .images(null) // null should preserve existing images
                .build();

        when(productRepository.findByIdWithDetailsAdmin(productId)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProductDto updated = adminProductService.updateProduct(productId, request);

        assertThat(updated).isNotNull();
        assertThat(updated.getPrice()).isEqualByComparingTo("5500.00");
        assertThat(updated.getImages()).hasSize(1);
    }

    @Test
    @DisplayName("updateProduct: Throws BusinessException 400 when stockQuantity is less than reservedQuantity")
    void updateProduct_StockLowerThanReserved() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .categoryId(categoryId)
                .sku("VAR-WAT-001")
                .price(new BigDecimal("5000.00"))
                .stockQuantity(1) // reserved is 2
                .isActive(true)
                .nameAr("ساعة")
                .nameEn("Watch")
                .build();

        when(productRepository.findByIdWithDetailsAdmin(productId)).thenReturn(Optional.of(sampleProduct));

        assertThatThrownBy(() -> adminProductService.updateProduct(productId, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
                .hasMessageContaining("لا يمكن تقليل كمية المخزون عن الكمية المحجوزة للطلبات الحالية");
    }

    @Test
    @DisplayName("updateProduct: Throws BusinessException 409 when changing SKU to an already used SKU")
    void updateProduct_DuplicateSkuOnUpdate() {
        UpdateProductRequest request = UpdateProductRequest.builder()
                .categoryId(categoryId)
                .sku("VAR-WAT-EXISTING")
                .build();

        when(productRepository.findByIdWithDetailsAdmin(productId)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.existsBySkuIgnoreCase("VAR-WAT-EXISTING")).thenReturn(true);

        assertThatThrownBy(() -> adminProductService.updateProduct(productId, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("مسجل بالفعل لمنتج آخر");
    }

    @Test
    @DisplayName("toggleProductStatus: Successfully toggles status to false and true")
    void toggleProductStatus_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProductDto deactivated = adminProductService.toggleProductStatus(productId, false);
        assertThat(deactivated.getIsActive()).isFalse();

        AdminProductDto reactivated = adminProductService.toggleProductStatus(productId, true);
        assertThat(reactivated.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("toggleProductStatus: Throws BusinessException 400 when activating product with zero price")
    void toggleProductStatus_ZeroPriceGuard() {
        sampleProduct.setPrice(BigDecimal.ZERO);
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));

        assertThatThrownBy(() -> adminProductService.toggleProductStatus(productId, true))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST)
                .hasMessageContaining("لا يمكن تفعيل منتج بسعر صفر أو أقل");
    }

    @Test
    @DisplayName("deleteProduct: Permanently hard-deletes product when no order history exists")
    void deleteProduct_HardDelete_WhenNoOrderHistory() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(orderItemRepository.existsByProductId(productId)).thenReturn(false);

        String message = adminProductService.deleteProduct(productId);

        assertThat(message).contains("تم حذف المنتج نهائياً بنجاح");
        verify(productRepository).delete(sampleProduct);
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteProduct: Soft-deletes (archives) product when order history exists")
    void deleteProduct_SoftDelete_WhenOrderHistoryExists() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(sampleProduct));
        when(orderItemRepository.existsByProductId(productId)).thenReturn(true);

        String message = adminProductService.deleteProduct(productId);

        assertThat(message).contains("تم أرشفة المنتج بنجاح وإلغاء تفعيله");
        assertThat(sampleProduct.getIsActive()).isFalse();
        verify(productRepository).save(sampleProduct);
        verify(productRepository, never()).delete(any());
    }
}
