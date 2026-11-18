package com.varellion.store.admin.customer;

import com.varellion.store.admin.customer.dto.AdminCustomerDetailDto;
import com.varellion.store.admin.customer.dto.PagedAdminCustomersResponse;
import com.varellion.store.admin.customer.service.AdminCustomerService;
import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.entity.CustomerAddress;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.Order;
import com.varellion.store.order.repository.OrderRepository;
import com.varellion.store.order.service.OrderService;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private AdminCustomerService adminCustomerService;

    private UUID customerId;
    private Customer sampleCustomer;
    private CustomerAddress sampleAddress;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();

        sampleAddress = CustomerAddress.builder()
                .addressId(UUID.randomUUID())
                .governorate("القاهرة")
                .cityArea("المعادي")
                .detailedAddress("شارع 9")
                .build();

        sampleCustomer = Customer.builder()
                .userId(customerId)
                .userAccountId(101L)
                .fullName("محمود حسن")
                .phoneNumber("01012345678")
                .isActive(true)
                .address(sampleAddress)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        sampleUser = User.builder()
                .id(101L)
                .email("mahmoud@example.com")
                .username("mahmoud@example.com")
                .build();
    }

    @Test
    @DisplayName("getAdminCustomers: Returns paginated response with spend, order count, and email")
    void getAdminCustomers_Success() {
        Page<Customer> page = new PageImpl<>(List.of(sampleCustomer));
        when(customerRepository.findAdminCustomers(eq("محمود"), any(Pageable.class))).thenReturn(page);
        when(userRepository.findAllById(List.of(101L))).thenReturn(List.of(sampleUser));

        List<Object[]> statsRows = List.<Object[]>of(
                new Object[]{customerId, 4L, new BigDecimal("8500.00")}
        );
        when(orderRepository.aggregateCustomerOrderStats()).thenReturn(statsRows);

        PagedAdminCustomersResponse response = adminCustomerService.getAdminCustomers(0, 10, "محمود");

        assertThat(response).isNotNull();
        assertThat(response.getCustomers()).hasSize(1);
        assertThat(response.getCustomers().get(0).getFullName()).isEqualTo("محمود حسن");
        assertThat(response.getCustomers().get(0).getEmail()).isEqualTo("mahmoud@example.com");
        assertThat(response.getCustomers().get(0).getTotalOrders()).isEqualTo(4L);
        assertThat(response.getCustomers().get(0).getTotalSpent()).isEqualByComparingTo("8500.00");
    }

    @Test
    @DisplayName("getAdminCustomerById: Returns full customer detail with address and lifetime stats")
    void getAdminCustomerById_Success() {
        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.of(sampleCustomer));
        when(userRepository.findById(101L)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.countOrdersByCustomer(customerId)).thenReturn(5L);
        when(orderRepository.calculateTotalSpentByCustomer(customerId)).thenReturn(new BigDecimal("12000.00"));

        AdminCustomerDetailDto detail = adminCustomerService.getAdminCustomerById(customerId);

        assertThat(detail).isNotNull();
        assertThat(detail.getCustomerId()).isEqualTo(customerId);
        assertThat(detail.getEmail()).isEqualTo("mahmoud@example.com");
        assertThat(detail.getGovernorate()).isEqualTo("القاهرة");
        assertThat(detail.getDetailedAddress()).isEqualTo("شارع 9");
        assertThat(detail.getTotalOrders()).isEqualTo(5L);
        assertThat(detail.getTotalSpent()).isEqualByComparingTo("12000.00");
    }

    @Test
    @DisplayName("getAdminCustomerById: Throws ResourceNotFoundException when customer not found")
    void getAdminCustomerById_NotFound() {
        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminCustomerService.getAdminCustomerById(customerId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("العميل المطلوب غير موجود");
    }

    @Test
    @DisplayName("getCustomerOrders: Returns order response list for customer")
    void getCustomerOrders_Success() {
        Order sampleOrder = Order.builder().orderNumber("VAR-20261117-0001").build();
        OrderResponseDto dto = OrderResponseDto.builder().orderNumber("VAR-20261117-0001").build();

        when(customerRepository.existsById(customerId)).thenReturn(true);
        when(orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(eq(customerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleOrder)));
        when(orderService.mapToDto(sampleOrder)).thenReturn(dto);

        List<OrderResponseDto> orders = adminCustomerService.getCustomerOrders(customerId, 0, 10);

        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).getOrderNumber()).isEqualTo("VAR-20261117-0001");
    }

    @Test
    @DisplayName("toggleCustomerStatus: Deactivating customer deactivates associated user account")
    void toggleCustomerStatus_DeactivateCustomerAndUser_Success() {
        sampleCustomer.setIsActive(true);
        sampleUser.setEnabled(true);

        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(101L)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.countOrdersByCustomer(customerId)).thenReturn(0L);
        when(orderRepository.calculateTotalSpentByCustomer(customerId)).thenReturn(BigDecimal.ZERO);

        AdminCustomerDetailDto deactivated = adminCustomerService.toggleCustomerStatus(customerId, false);

        assertThat(sampleCustomer.getIsActive()).isFalse();
        assertThat(sampleUser.isEnabled()).isFalse();
        assertThat(deactivated.getIsActive()).isFalse();
        verify(customerRepository).save(sampleCustomer);
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("toggleCustomerStatus: Activating customer activates associated user account")
    void toggleCustomerStatus_ActivateCustomerAndUser_Success() {
        sampleCustomer.setIsActive(false);
        sampleUser.setEnabled(false);

        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(101L)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.countOrdersByCustomer(customerId)).thenReturn(0L);
        when(orderRepository.calculateTotalSpentByCustomer(customerId)).thenReturn(BigDecimal.ZERO);

        AdminCustomerDetailDto activated = adminCustomerService.toggleCustomerStatus(customerId, true);

        assertThat(sampleCustomer.getIsActive()).isTrue();
        assertThat(sampleUser.isEnabled()).isTrue();
        assertThat(activated.getIsActive()).isTrue();
        verify(customerRepository).save(sampleCustomer);
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("toggleCustomerStatus: Customer without userAccountId updates customer without touching userRepository")
    void toggleCustomerStatus_CustomerWithoutUserAccount_Success() {
        sampleCustomer.setUserAccountId(null);
        sampleCustomer.setIsActive(true);

        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.countOrdersByCustomer(customerId)).thenReturn(0L);
        when(orderRepository.calculateTotalSpentByCustomer(customerId)).thenReturn(BigDecimal.ZERO);

        AdminCustomerDetailDto deactivated = adminCustomerService.toggleCustomerStatus(customerId, false);

        assertThat(sampleCustomer.getIsActive()).isFalse();
        assertThat(deactivated.getIsActive()).isFalse();
        verify(customerRepository).save(sampleCustomer);
        verify(userRepository, never()).save(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("toggleCustomerStatus: Failure when updating user account throws exception to trigger transaction rollback")
    void toggleCustomerStatus_WhenUserUpdateFails_PropagatesExceptionForRollback() {
        sampleCustomer.setIsActive(true);
        sampleUser.setEnabled(true);

        when(customerRepository.findByIdWithAddress(customerId)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(101L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenThrow(new RuntimeException("Database error saving user"));

        assertThatThrownBy(() -> adminCustomerService.toggleCustomerStatus(customerId, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Database error saving user");

        verify(customerRepository).save(sampleCustomer);
        verify(userRepository).save(sampleUser);
    }
}
