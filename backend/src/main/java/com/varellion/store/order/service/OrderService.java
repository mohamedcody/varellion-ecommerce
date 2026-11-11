package com.varellion.store.order.service;

import com.varellion.store.admin.order.dto.PagedOrdersResponse;
import com.varellion.store.cart.service.CartService;
import com.varellion.store.catalog.entity.Product;
import com.varellion.store.catalog.entity.ProductImage;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.service.CustomerService;
import com.varellion.store.order.dto.CreateOrderRequest;
import com.varellion.store.order.dto.OrderItemDto;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.dto.OrderStatusHistoryDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderItem;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.entity.OrderStatusHistory;
import com.varellion.store.order.entity.ShippingFeeStatus;
import com.varellion.store.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing order creation, retrieval, tracking, status transitions, and timeline generation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final ProductRepository productRepository;
    private final CartService cartService;

    /**
     * Normalizes Egyptian phone numbers into an 11-digit standard string (01XXXXXXXXX).
     * Handles +20, 0020, 20 prefixes, spaces, and hyphens.
     */
    public static String normalizeEgyptianPhone(String raw) {
        if (raw == null) return "";
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("0020")) {
            digits = "0" + digits.substring(4);
        } else if (digits.startsWith("20") && digits.length() == 12) {
            digits = "0" + digits.substring(2);
        } else if (!digits.startsWith("0") && digits.length() == 10 && (digits.startsWith("10") || digits.startsWith("11") || digits.startsWith("12") || digits.startsWith("15"))) {
            digits = "0" + digits;
        }
        return digits;
    }

    private String normalizeArabicGov(String input) {
        if (input == null) return "";
        return input.trim()
                .replace('إ', 'ا')
                .replace('أ', 'ا')
                .replace('آ', 'ا')
                .replace('ة', 'ه')
                .replace('ى', 'ي');
    }

    /**
     * Calculates the estimated delivery duration according to the customer's governorate.
     */
    public String calculateEstimatedDelivery(String governorate) {
        if (governorate == null || governorate.isBlank()) {
            return "2 - 3 أيام عمل";
        }
        String govNorm = normalizeArabicGov(governorate);
        if (govNorm.contains("القاهره") || govNorm.contains("الجيزه") || govNorm.equalsIgnoreCase("Cairo") || govNorm.equalsIgnoreCase("Giza")) {
            return "1 - 2 يوم عمل (شحن سريع)";
        } else if (govNorm.contains("الاسكندريه") || govNorm.equalsIgnoreCase("Alexandria") || govNorm.contains("الدقهليه")
                || govNorm.contains("الغربيه") || govNorm.contains("الشرقيه") || govNorm.contains("المنوفيه")
                || govNorm.contains("القليوبيه") || govNorm.contains("البحيره") || govNorm.contains("كفر الشيخ")
                || govNorm.contains("دمياط") || govNorm.contains("بورسعيد") || govNorm.contains("الاسماعيليه") || govNorm.contains("السويس")) {
            return "2 - 3 أيام عمل";
        } else {
            return "3 - 5 أيام عمل (محافظات الصعيد والحدود)";
        }
    }

    /**
     * Calculates authoritative shipping fee according to customer governorate and subtotal.
     * Orders >= 2500 EGP receive free shipping.
     */
    public BigDecimal calculateAuthoritativeShippingFee(String governorate, BigDecimal subtotal) {
        if (subtotal != null && subtotal.compareTo(new BigDecimal("2500")) >= 0) {
            return BigDecimal.ZERO;
        }
        if (governorate == null || governorate.isBlank()) {
            return new BigDecimal("60.00");
        }
        String govNorm = normalizeArabicGov(governorate);
        if (govNorm.contains("القاهره") || govNorm.contains("الجيزه") || govNorm.contains("القليوبيه")
                || govNorm.equalsIgnoreCase("Cairo") || govNorm.equalsIgnoreCase("Giza") || govNorm.equalsIgnoreCase("Qalyubia")) {
            return new BigDecimal("50.00");
        } else if (govNorm.contains("الاسكندريه") || govNorm.contains("مطروح")
                || govNorm.equalsIgnoreCase("Alexandria") || govNorm.equalsIgnoreCase("Matrouh")) {
            return new BigDecimal("60.00");
        } else if (govNorm.contains("الدقهليه") || govNorm.contains("الغربيه") || govNorm.contains("الشرقيه")
                || govNorm.contains("المنوفيه") || govNorm.contains("كفر الشيخ") || govNorm.contains("البحيره")
                || govNorm.contains("دمياط") || govNorm.contains("بورسعيد") || govNorm.contains("الاسماعيليه") || govNorm.contains("السويس")) {
            return new BigDecimal("65.00");
        } else if (govNorm.contains("الفيوم") || govNorm.contains("بني سويف") || govNorm.contains("المنيا") || govNorm.contains("اسيوط")) {
            return new BigDecimal("75.00");
        } else {
            return new BigDecimal("85.00");
        }
    }

    /**
     * Authoritative order placement:
     * 1. Resolves authenticated customer profile.
     * 2. Acquires pessimistic write lock on products and verifies available inventory.
     * 3. Calculates authoritative server-side financials and shipping.
     * 4. Persists immutable Order, OrderItem, and OrderStatusHistory records.
     * 5. Clears authenticated customer's cart.
     */
    @Transactional
    public OrderResponseDto createOrder(String userEmail, CreateOrderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("يجب أن يحتوي الطلب على منتج واحد على الأقل");
        }

        // 1. Validate against duplicate product IDs in the order request
        long uniqueProductCount = request.getItems().stream()
                .map(CreateOrderRequest.CreateOrderItemRequest::getProductId)
                .distinct()
                .count();
        if (uniqueProductCount != request.getItems().size()) {
            throw new IllegalArgumentException("لا يمكن تكرار نفس المنتج في بنود الطلب الواحد");
        }

        // 2. Resolve Customer profile
        Customer customer = customerService.getOrCreateCustomerForUser(userEmail, request.getCustomerName());

        // 3. Lock and verify stock for each requested product in deterministic sorted order (Deadlock Prevention)
        List<CreateOrderRequest.CreateOrderItemRequest> sortedItems = request.getItems().stream()
                .sorted(Comparator.comparing(CreateOrderRequest.CreateOrderItemRequest::getProductId))
                .toList();

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateOrderRequest.CreateOrderItemRequest itemReq : sortedItems) {
            Product product = productRepository.findByIdForUpdate(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("المنتج المطلوب غير موجود: " + itemReq.getProductId()));

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new IllegalArgumentException("المنتج '" + product.getNameAr() + "' غير متاح للشراء حالياً.");
            }

            int availableStock = (product.getStockQuantity() != null ? product.getStockQuantity() : 0)
                    - (product.getReservedQuantity() != null ? product.getReservedQuantity() : 0);

            if (availableStock < itemReq.getQuantity()) {
                throw new IllegalArgumentException("الكمية المطلوبة من المنتج '" + product.getNameAr() + "' غير متوفرة في المخزون (المتبقي: " + Math.max(0, availableStock) + ")");
            }

            // Increment reserved quantity
            product.setReservedQuantity((product.getReservedQuantity() != null ? product.getReservedQuantity() : 0) + itemReq.getQuantity());
            productRepository.save(product);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productNameAr(product.getNameAr())
                    .productNameEn(product.getNameEn())
                    .sku(product.getSku())
                    .unitPrice(product.getPrice())
                    .unitCost(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
                    .quantity(itemReq.getQuantity())
                    .lineTotal(lineTotal)
                    .build();

            orderItems.add(orderItem);
        }

        // 3. Compute Authoritative Financials
        BigDecimal shippingFee = calculateAuthoritativeShippingFee(request.getShippingGovernorate(), subtotal);
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountTotal);

        // 4. Generate Unique Order Number
        String orderNumber = generateUniqueOrderNumber();

        // 5. Notes and Payment Method handling
        String combinedNotes = request.getCustomerNotes();
        if (request.getAlternativePhone() != null && !request.getAlternativePhone().isBlank()) {
            String altNote = "هاتف بديل: " + request.getAlternativePhone().trim();
            combinedNotes = (combinedNotes != null && !combinedNotes.isBlank())
                    ? combinedNotes + " | " + altNote
                    : altNote;
        }

        String adminNotes = null;
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            adminNotes = "طريقة الدفع المطلوبة: " + request.getPaymentMethod().trim();
        }

        // 6. Instantiate and Persist Order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .customerName(request.getCustomerName().trim())
                .customerPhone(normalizeEgyptianPhone(request.getCustomerPhone()))
                .shippingGovernorate(request.getShippingGovernorate().trim())
                .shippingCityArea(request.getShippingCityArea().trim())
                .shippingDetailedAddress(request.getShippingDetailedAddress().trim())
                .currency("EGP")
                .subtotal(subtotal)
                .discountTotal(discountTotal)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .orderStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION)
                .shippingFeeStatus(ShippingFeeStatus.PENDING)
                .confirmationDeadline(OffsetDateTime.now().plusHours(24))
                .customerNotes(combinedNotes)
                .adminNotes(adminNotes)
                .items(new ArrayList<>())
                .statusHistory(new ArrayList<>())
                .build();

        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
            order.getItems().add(oi);
        }

        OrderStatusHistory initialHistory = OrderStatusHistory.builder()
                .order(order)
                .newStatus(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name())
                .reason("تم تسجيل وتأكيد الطلب عبر المتجر")
                .build();
        order.getStatusHistory().add(initialHistory);

        Order savedOrder = orderRepository.save(order);

        // 7. Clear customer cart upon authoritative order placement
        try {
            cartService.clearCart(userEmail);
        } catch (Exception ex) {
            log.warn("[OrderService] Failed to clear cart after order {}: {}", orderNumber, ex.getMessage());
        }

        log.info("[OrderService] Successfully placed order {} for user {}", orderNumber, userEmail);
        OrderResponseDto dto = mapToDto(savedOrder);
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            dto.setPaymentMethod(request.getPaymentMethod().trim());
        }
        return dto;
    }

    private String generateUniqueOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 10; i++) {
            int randomSuffix = 1000 + random.nextInt(9000);
            String candidate = "VAR-" + datePart + "-" + randomSuffix;
            if (!orderRepository.existsByOrderNumberIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return String.format("VAR-%s-%04d", datePart, Math.abs(System.currentTimeMillis() % 10000));
    }

    /**
     * Public guest tracking lookup: Requires exact orderNumber AND matching registered phone.
     */
    @Transactional(readOnly = true)
    public OrderResponseDto trackOrder(String orderNumber, String phone) {
        if (orderNumber == null || phone == null) {
            throw new ResourceNotFoundException("لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.");
        }

        String cleanNumber = orderNumber.trim().toUpperCase();
        String normalizedInputPhone = normalizeEgyptianPhone(phone);

        Order order = orderRepository.findByOrderNumberWithDetails(cleanNumber)
                .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين."));

        String normalizedOrderPhone = normalizeEgyptianPhone(order.getCustomerPhone());

        if (!normalizedInputPhone.equals(normalizedOrderPhone)) {
            log.warn("[OrderTracking] Phone mismatch for order {}: input phone does not match stored phone", cleanNumber);
            throw new ResourceNotFoundException("لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.");
        }

        return mapToDto(order);
    }

    /**
     * Retrieves paginated orders for administrative overview with optional status and search filtering.
     */
    @Transactional(readOnly = true)
    public PagedOrdersResponse getAdminOrders(int page, int limit, OrderStatus status, String search) {
        int sanitizedPage = Math.max(0, page);
        int sanitizedLimit = Math.max(1, Math.min(100, limit));
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedLimit);

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Order> orderPage = orderRepository.findAdminOrders(status, cleanSearch, pageable);

        List<OrderResponseDto> dtos = orderPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PagedOrdersResponse(
                dtos,
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.getNumber(),
                orderPage.getSize()
        );
    }

    /**
     * Retrieves full administrative order details by orderNumber.
     */
    @Transactional(readOnly = true)
    public OrderResponseDto getAdminOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));
        return mapToDto(order);
    }

    /**
     * Retrieves paginated order history for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getCustomerOrders(String usernameOrEmail, int page, int limit) {
        Customer customer = customerService.getOrCreateCustomerForUser(usernameOrEmail);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit));
        Page<Order> orderPage = orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(customer.getUserId(), pageable);
        return orderPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single order for the authenticated customer by order number.
     */
    @Transactional(readOnly = true)
    public OrderResponseDto getCustomerOrderByNumber(String usernameOrEmail, String orderNumber) {
        Customer customer = customerService.getOrCreateCustomerForUser(usernameOrEmail);
        Order order = orderRepository.findByCustomerUserIdAndOrderNumber(customer.getUserId(), orderNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));
        return mapToDto(order);
    }

    /**
     * Maps Order entity to public/authenticated OrderResponseDto.
     */
    public OrderResponseDto mapToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems() != null
                ? order.getItems().stream().map(this::mapItemToDto).collect(Collectors.toList())
                : Collections.emptyList();

        List<OrderStatusHistoryDto> historyDtos = order.getStatusHistory() != null
                ? order.getStatusHistory().stream()
                .sorted(Comparator.comparing(OrderStatusHistory::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::mapHistoryToDto)
                .collect(Collectors.toList())
                : new ArrayList<>();

        if (order.getOrderStatus() != null) {
            boolean hasCurrentStatus = historyDtos.stream()
                    .anyMatch(h -> h.getNewStatus() != null && order.getOrderStatus().name().equalsIgnoreCase(h.getNewStatus().trim()));
            if (!hasCurrentStatus) {
                historyDtos = new ArrayList<>(historyDtos);
                historyDtos.add(OrderStatusHistoryDto.builder()
                        .previousStatus(historyDtos.isEmpty() ? null : historyDtos.get(historyDtos.size() - 1).getNewStatus())
                        .newStatus(order.getOrderStatus().name())
                        .statusDisplayAr(getStatusDisplayAr(order.getOrderStatus()))
                        .statusDisplayEn(getStatusDisplayEn(order.getOrderStatus()))
                        .reason("حالة الطلب: " + getStatusDisplayAr(order.getOrderStatus()))
                        .createdAt(order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt())
                        .build());
            }
        }

        return OrderResponseDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .shippingGovernorate(order.getShippingGovernorate())
                .shippingCityArea(order.getShippingCityArea())
                .shippingDetailedAddress(order.getShippingDetailedAddress())
                .currency(order.getCurrency())
                .subtotal(order.getSubtotal())
                .discountTotal(order.getDiscountTotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus())
                .statusDisplayAr(getStatusDisplayAr(order.getOrderStatus()))
                .statusDisplayEn(getStatusDisplayEn(order.getOrderStatus()))
                .shippingFeeStatus(order.getShippingFeeStatus())
                .estimatedDeliveryAr(order.getOrderStatus() == OrderStatus.DELIVERED
                        ? "تم التسليم بنجاح"
                        : calculateEstimatedDelivery(order.getShippingGovernorate()))
                .confirmationDeadline(order.getConfirmationDeadline())
                .customerNotes(order.getCustomerNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemDtos)
                .statusHistory(historyDtos)
                .build();
    }

    /**
     * Programmatically updates an order's status and records the transition in status history.
     * Backward-compatible 3-argument overload delegating to actor-aware transition method.
     */
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
        return updateOrderStatus(orderNumber, newStatus, reason, (Long) null);
    }

    /**
     * Updates order lifecycle status with audit actor tracking, idempotency, and state machine validation.
     *
     * @param orderNumber The order identifier
     * @param newStatus   The target status
     * @param reason      Optional reason description
     * @param actorId     The Long ID of the admin/system actor initiating the transition
     * @return Updated order details
     */
    @Transactional
    public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, Long actorId) {
        Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));

        OrderStatus currentStatus = order.getOrderStatus();

        // 1. Idempotency Check: immediate return without saving duplicate history
        if (currentStatus == newStatus) {
            log.info("[OrderService] Order {} is already in status {}. Idempotent no-op.", orderNumber, newStatus);
            return mapToDto(order);
        }

        // 2. State Machine Validation: prevent invalid and illogical backward transitions
        if (currentStatus != null && !currentStatus.canTransitionTo(newStatus)) {
            throw new BusinessException(String.format(
                    "لا يمكن تحويل حالة الطلب من '%s' إلى '%s'",
                    getStatusDisplayAr(currentStatus),
                    getStatusDisplayAr(newStatus)
            ));
        }

        // 3. Apply state transition
        order.setOrderStatus(newStatus);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .previousStatus(currentStatus != null ? currentStatus.name() : null)
                .newStatus(newStatus.name())
                .reason(reason != null ? reason : "Status changed to " + newStatus.name())
                .actorId(actorId)
                .createdAt(OffsetDateTime.now())
                .build();

        if (order.getStatusHistory() == null) {
            order.setStatusHistory(new ArrayList<>());
        }
        order.getStatusHistory().add(history);
        Order savedOrder = orderRepository.save(order);
        return mapToDto(savedOrder);
    }

    private OrderItemDto mapItemToDto(OrderItem item) {
        String mainImageUrl = null;
        if (item.getProduct() != null && item.getProduct().getImages() != null) {
            mainImageUrl = item.getProduct().getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElseGet(() -> item.getProduct().getImages().isEmpty() ? null : item.getProduct().getImages().get(0).getImageUrl());
        }

        return OrderItemDto.builder()
                .orderItemId(item.getOrderItemId())
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productNameAr(item.getProductNameAr())
                .productNameEn(item.getProductNameEn())
                .productSku(item.getSku())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .imageUrl(mainImageUrl)
                .build();
    }

    private OrderStatusHistoryDto mapHistoryToDto(OrderStatusHistory h) {
        OrderStatus newStatusEnum = null;
        String rawNewStatus = h.getNewStatus() != null ? h.getNewStatus().trim() : null;
        try {
            if (rawNewStatus != null) {
                newStatusEnum = OrderStatus.valueOf(rawNewStatus.toUpperCase());
            }
        } catch (IllegalArgumentException ignored) {}

        String canonicalNewStatus = newStatusEnum != null ? newStatusEnum.name() : rawNewStatus;
        String trimmedPreviousStatus = h.getPreviousStatus() != null ? h.getPreviousStatus().trim() : null;

        return OrderStatusHistoryDto.builder()
                .historyId(h.getHistoryId())
                .previousStatus(trimmedPreviousStatus)
                .newStatus(canonicalNewStatus)
                .statusDisplayAr(newStatusEnum != null ? getStatusDisplayAr(newStatusEnum) : rawNewStatus)
                .statusDisplayEn(newStatusEnum != null ? getStatusDisplayEn(newStatusEnum) : rawNewStatus)
                .reason(h.getReason())
                .createdAt(h.getCreatedAt())
                .build();
    }

    public static String getStatusDisplayAr(OrderStatus status) {
        if (status == null) return "غير محدد";
        return switch (status) {
            case PENDING_CUSTOMER_CONFIRMATION -> "تم استلام الطلب وبانتظار التأكيد";
            case CONFIRMED -> "تم تأكيد الطلب بنجاح";
            case PREPARING -> "قيد التجهيز الملكي والفحص";
            case SHIPPED -> "مع مندوب التوصيل";
            case DELIVERED -> "تم التسليم بنجاح";
            case DELIVERY_FAILED -> "تعذر التسليم (جاري إعادة المحاولة)";
            case CANCELLED -> "تم إلغاء الطلب";
            case EXPIRED -> "انتهت مهلة تأكيد الطلب";
            case RETURNED -> "تم استرجاع الطلب";
            case EXCHANGED -> "تم استبدال الطلب";
        };
    }

    public static String getStatusDisplayEn(OrderStatus status) {
        if (status == null) return "Unknown";
        return switch (status) {
            case PENDING_CUSTOMER_CONFIRMATION -> "Pending Confirmation";
            case CONFIRMED -> "Confirmed";
            case PREPARING -> "Preparing & Inspection";
            case SHIPPED -> "Out for Delivery";
            case DELIVERED -> "Delivered";
            case DELIVERY_FAILED -> "Delivery Failed";
            case CANCELLED -> "Cancelled";
            case EXPIRED -> "Expired";
            case RETURNED -> "Returned";
            case EXCHANGED -> "Exchanged";
        };
    }
}
