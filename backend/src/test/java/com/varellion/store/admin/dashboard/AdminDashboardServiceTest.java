package com.varellion.store.admin.dashboard;

import com.varellion.store.admin.dashboard.dto.DashboardSummaryDto;
import com.varellion.store.admin.dashboard.dto.SalesAnalyticsDto;
import com.varellion.store.admin.dashboard.service.AdminDashboardService;
import com.varellion.store.catalog.repository.ProductRepository;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private AdminDashboardService adminDashboardService;

    @Test
    @DisplayName("getSummary: Aggregates revenue, order volumes, low stock items and customer count")
    void getSummary_Success() {
        when(orderRepository.calculateTotalRevenue()).thenReturn(new BigDecimal("125000.00"));
        when(orderRepository.count()).thenReturn(45L);
        when(productRepository.countLowStockProducts(5)).thenReturn(3L);
        when(customerRepository.count()).thenReturn(28L);

        List<Object[]> statusRows = List.of(
                new Object[]{OrderStatus.PENDING_CUSTOMER_CONFIRMATION, 5L},
                new Object[]{OrderStatus.CONFIRMED, 4L},
                new Object[]{OrderStatus.PREPARING, 2L},
                new Object[]{OrderStatus.DELIVERED, 30L}
        );
        when(orderRepository.countOrdersGroupByStatus()).thenReturn(statusRows);

        DashboardSummaryDto summary = adminDashboardService.getSummary();

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalRevenue()).isEqualByComparingTo("125000.00");
        assertThat(summary.getTotalOrders()).isEqualTo(45L);
        assertThat(summary.getPendingOrders()).isEqualTo(11L); // 5 + 4 + 2
        assertThat(summary.getDeliveredOrders()).isEqualTo(30L);
        assertThat(summary.getLowStockProductsCount()).isEqualTo(3L);
        assertThat(summary.getTotalCustomers()).isEqualTo(28L);
    }

    @Test
    @DisplayName("getOrderStatusStats: Returns complete map containing every OrderStatus enum")
    void getOrderStatusStats_ContainsAllStatuses() {
        List<Object[]> statusRows = List.of(
                new Object[]{OrderStatus.CONFIRMED, 10L},
                new Object[]{OrderStatus.SHIPPED, 7L}
        );
        when(orderRepository.countOrdersGroupByStatus()).thenReturn(statusRows);

        Map<String, Long> stats = adminDashboardService.getOrderStatusStats();

        assertThat(stats).isNotNull();
        assertThat(stats.keySet()).contains(
                OrderStatus.PENDING_CUSTOMER_CONFIRMATION.name(),
                OrderStatus.CONFIRMED.name(),
                OrderStatus.PREPARING.name(),
                OrderStatus.SHIPPED.name(),
                OrderStatus.DELIVERED.name(),
                OrderStatus.CANCELLED.name()
        );
        assertThat(stats.get(OrderStatus.CONFIRMED.name())).isEqualTo(10L);
        assertThat(stats.get(OrderStatus.SHIPPED.name())).isEqualTo(7L);
        assertThat(stats.get(OrderStatus.CANCELLED.name())).isEqualTo(0L);
    }

    @Test
    @DisplayName("getSalesAnalytics: Constructs continuous timeline and aggregates revenue and count")
    void getSalesAnalytics_BuildsContinuousTimeline() {
        OffsetDateTime now = OffsetDateTime.now();
        Order o1 = Order.builder()
                .totalAmount(new BigDecimal("1500.00"))
                .createdAt(now)
                .build();
        Order o2 = Order.builder()
                .totalAmount(new BigDecimal("2500.00"))
                .createdAt(now)
                .build();

        when(orderRepository.findOrdersForAnalytics(any())).thenReturn(List.of(o1, o2));

        SalesAnalyticsDto analytics = adminDashboardService.getSalesAnalytics(7);

        assertThat(analytics).isNotNull();
        assertThat(analytics.getPeriodDays()).isEqualTo(7);
        assertThat(analytics.getTimeline()).hasSize(7);
        assertThat(analytics.getTotalPeriodRevenue()).isEqualByComparingTo("4000.00");
        assertThat(analytics.getTotalPeriodOrders()).isEqualTo(2L);
    }
}
