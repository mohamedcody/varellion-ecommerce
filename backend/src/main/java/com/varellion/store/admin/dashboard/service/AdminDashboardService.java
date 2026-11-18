package com.varellion.store.admin.dashboard.service;

import com.varellion.store.admin.dashboard.dto.DashboardSummaryDto;
import com.varellion.store.admin.dashboard.dto.SalesAnalyticsDto;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 5;

    /**
     * Aggregates high-level business performance metrics.
     */
    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        long totalOrders = orderRepository.count();
        long lowStockCount = productRepository.countLowStockProducts(DEFAULT_LOW_STOCK_THRESHOLD);
        long totalCustomers = customerRepository.count();

        Map<String, Long> statusStats = getOrderStatusStats();

        long pending = statusStats.getOrDefault(OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name(), 0L)
                + statusStats.getOrDefault(OrderStatus.CONFIRMED.name(), 0L)
                + statusStats.getOrDefault(OrderStatus.PREPARING.name(), 0L);

        long delivered = statusStats.getOrDefault(OrderStatus.DELIVERED.name(), 0L);

        return DashboardSummaryDto.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .pendingOrders(pending)
                .deliveredOrders(delivered)
                .lowStockProductsCount(lowStockCount)
                .totalCustomers(totalCustomers)
                .build();
    }

    /**
     * Returns an exhaustive mapping of counts for every OrderStatus enum.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getOrderStatusStats() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            result.put(status.name(), 0L);
        }

        List<Object[]> rows = orderRepository.countOrdersGroupByStatus();
        if (rows != null) {
            for (Object[] row : rows) {
                if (row[0] instanceof OrderStatus status && row[1] instanceof Number count) {
                    result.put(status.name(), count.longValue());
                }
            }
        }
        return result;
    }

    /**
     * Produces daily time-series revenue and order volume analytics.
     */
    @Transactional(readOnly = true)
    public SalesAnalyticsDto getSalesAnalytics(int requestedDays) {
        int days = Math.max(7, Math.min(90, requestedDays));
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        OffsetDateTime startDateTime = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);

        List<Order> orders = orderRepository.findOrdersForAnalytics(startDateTime);

        Map<LocalDate, BigDecimal> dailyRevenueMap = new HashMap<>();
        Map<LocalDate, Long> dailyCountMap = new HashMap<>();

        if (orders != null) {
            for (Order order : orders) {
                if (order.getCreatedAt() != null) {
                    LocalDate orderDate = order.getCreatedAt().toLocalDate();
                    BigDecimal amt = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
                    dailyRevenueMap.merge(orderDate, amt, BigDecimal::add);
                    dailyCountMap.merge(orderDate, 1L, Long::sum);
                }
            }
        }

        List<SalesAnalyticsDto.DailySalesPointDto> timeline = new ArrayList<>();
        BigDecimal totalPeriodRevenue = BigDecimal.ZERO;
        long totalPeriodOrders = 0;

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;

        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            BigDecimal rev = dailyRevenueMap.getOrDefault(d, BigDecimal.ZERO);
            long cnt = dailyCountMap.getOrDefault(d, 0L);

            totalPeriodRevenue = totalPeriodRevenue.add(rev);
            totalPeriodOrders += cnt;

            timeline.add(SalesAnalyticsDto.DailySalesPointDto.builder()
                    .date(d.format(formatter))
                    .revenue(rev)
                    .ordersCount(cnt)
                    .build());
        }

        return SalesAnalyticsDto.builder()
                .periodDays(days)
                .totalPeriodRevenue(totalPeriodRevenue)
                .totalPeriodOrders(totalPeriodOrders)
                .timeline(timeline)
                .build();
    }
}
