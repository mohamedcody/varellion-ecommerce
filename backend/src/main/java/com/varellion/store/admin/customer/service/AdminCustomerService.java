package com.varellion.store.admin.customer.service;

import com.varellion.store.admin.customer.dto.AdminCustomerDetailDto;
import com.varellion.store.admin.customer.dto.AdminCustomerSummaryDto;
import com.varellion.store.admin.customer.dto.PagedAdminCustomersResponse;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.repository.OrderRepository;
import com.varellion.store.order.service.OrderService;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    /**
     * Retrieves paginated customers with aggregated spend, order count, and search capability.
     */
    @Transactional(readOnly = true)
    public PagedAdminCustomersResponse getAdminCustomers(int page, int limit, String search) {
        int sanitizedPage = Math.max(0, page);
        int sanitizedSize = (limit <= 0 || limit > 100) ? 20 : limit;
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Customer> customerPage = customerRepository.findAdminCustomers(cleanSearch, pageable);

        // Fetch user account emails in batch
        List<Long> userAccountIds = customerPage.getContent().stream()
                .map(Customer::getUserAccountId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, String> emailMap = new HashMap<>();
        if (!userAccountIds.isEmpty()) {
            List<User> users = userRepository.findAllById(userAccountIds);
            for (User u : users) {
                emailMap.put(u.getId(), u.getEmail());
            }
        }

        // Fetch aggregated order counts and total spent
        Map<UUID, Long> orderCountMap = new HashMap<>();
        Map<UUID, BigDecimal> totalSpentMap = new HashMap<>();
        List<Object[]> statsRows = orderRepository.aggregateCustomerOrderStats();
        if (statsRows != null) {
            for (Object[] row : statsRows) {
                if (row[0] instanceof UUID cId && row[1] instanceof Number cnt && row[2] instanceof BigDecimal spent) {
                    orderCountMap.put(cId, cnt.longValue());
                    totalSpentMap.put(cId, spent);
                }
            }
        }

        List<AdminCustomerSummaryDto> dtoList = customerPage.getContent().stream()
                .map(c -> AdminCustomerSummaryDto.builder()
                        .customerId(c.getUserId())
                        .userAccountId(c.getUserAccountId())
                        .fullName(c.getFullName())
                        .email(c.getUserAccountId() != null ? emailMap.get(c.getUserAccountId()) : null)
                        .phoneNumber(c.getPhoneNumber())
                        .governorate(c.getAddress() != null ? c.getAddress().getGovernorate() : null)
                        .cityArea(c.getAddress() != null ? c.getAddress().getCityArea() : null)
                        .isActive(c.getIsActive())
                        .totalOrders(orderCountMap.getOrDefault(c.getUserId(), 0L))
                        .totalSpent(totalSpentMap.getOrDefault(c.getUserId(), BigDecimal.ZERO))
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();

        return PagedAdminCustomersResponse.builder()
                .customers(dtoList)
                .totalElements(customerPage.getTotalElements())
                .totalPages(customerPage.getTotalPages())
                .currentPage(customerPage.getNumber())
                .pageSize(customerPage.getSize())
                .build();
    }

    /**
     * Retrieves full customer profile including delivery address and lifetime stats.
     */
    @Transactional(readOnly = true)
    public AdminCustomerDetailDto getAdminCustomerById(UUID customerId) {
        Customer customer = customerRepository.findByIdWithAddress(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("العميل المطلوب غير موجود: " + customerId));

        String email = null;
        if (customer.getUserAccountId() != null) {
            email = userRepository.findById(customer.getUserAccountId())
                    .map(User::getEmail)
                    .orElse(null);
        }

        long totalOrders = orderRepository.countOrdersByCustomer(customerId);
        BigDecimal totalSpent = orderRepository.calculateTotalSpentByCustomer(customerId);

        return AdminCustomerDetailDto.builder()
                .customerId(customer.getUserId())
                .userAccountId(customer.getUserAccountId())
                .fullName(customer.getFullName())
                .email(email)
                .phoneNumber(customer.getPhoneNumber())
                .isActive(customer.getIsActive())
                .governorate(customer.getAddress() != null ? customer.getAddress().getGovernorate() : null)
                .cityArea(customer.getAddress() != null ? customer.getAddress().getCityArea() : null)
                .detailedAddress(customer.getAddress() != null ? customer.getAddress().getDetailedAddress() : null)
                .totalOrders(totalOrders)
                .totalSpent(totalSpent != null ? totalSpent : BigDecimal.ZERO)
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    /**
     * Retrieves an individual customer's orders history for admin inspection.
     */
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getCustomerOrders(UUID customerId, int page, int limit) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("العميل المطلوب غير موجود: " + customerId);
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, limit)));
        Page<Order> orderPage = orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(customerId, pageable);

        return orderPage.getContent().stream()
                .map(orderService::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Toggles customer active status (e.g. banning or unbanning an account).
     * Synchronizes active status with the linked User security account within a single transaction.
     */
    @Transactional
    public AdminCustomerDetailDto toggleCustomerStatus(UUID customerId, boolean isActive) {
        Customer customer = customerRepository.findByIdWithAddress(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("العميل المطلوب غير موجود: " + customerId));

        customer.setIsActive(isActive);
        Customer saved = customerRepository.save(customer);

        if (customer.getUserAccountId() != null) {
            User user = userRepository.findById(customer.getUserAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("حساب المستخدم المرتبط بالعميل غير موجود: " + customer.getUserAccountId()));
            user.setEnabled(isActive);
            userRepository.save(user);
        }

        log.info("[AdminCustomerService] Toggled customer {} (userAccountId: {}) active status to {}",
                customerId, customer.getUserAccountId(), isActive);

        return getAdminCustomerById(saved.getUserId());
    }
}
