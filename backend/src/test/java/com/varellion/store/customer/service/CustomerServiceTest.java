package com.varellion.store.customer.service;

import com.varellion.store.customer.dto.AddressDto;
import com.varellion.store.customer.dto.CustomerDto;
import com.varellion.store.customer.dto.UpdateProfileRequest;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.entity.CustomerAddress;
import com.varellion.store.customer.repository.CustomerAddressRepository;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerAddressRepository customerAddressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomerService customerService;

    private User testUser;
    private Customer testCustomer;
    private CustomerAddress testAddress;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(10L)
                .username("ahmed_ali")
                .email("ahmed@varellion.com")
                .role("USER")
                .enabled(true)
                .build();

        UUID customerUUID = customerService.deriveCustomerUUID(testUser);

        testCustomer = Customer.builder()
                .userId(customerUUID)
                .userAccountId(testUser.getId())
                .fullName("Ahmed Ali")
                .phoneNumber("01012345678")
                .isActive(true)
                .build();

        testAddress = CustomerAddress.builder()
                .addressId(UUID.randomUUID())
                .customer(testCustomer)
                .governorate("Cairo")
                .cityArea("Nasr City")
                .detailedAddress("10 Abbas El Akkad St")
                .build();
    }

    @Test
    @DisplayName("Should retrieve customer profile and address when user exists")
    void testGetProfileSuccess() {
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.of(testCustomer));
        when(customerAddressRepository.findByCustomer_UserId(testCustomer.getUserId())).thenReturn(Optional.of(testAddress));

        CustomerDto profile = customerService.getProfile("ahmed_ali");

        assertThat(profile).isNotNull();
        assertThat(profile.getFullName()).isEqualTo("Ahmed Ali");
        assertThat(profile.getPhoneNumber()).isEqualTo("01012345678");
        assertThat(profile.getEmail()).isEqualTo("ahmed@varellion.com");
        assertThat(profile.getAddress()).isNotNull();
        assertThat(profile.getAddress().getGovernorate()).isEqualTo("Cairo");
    }

    @Test
    @DisplayName("Should auto-provision customer profile if absent upon login/lookup")
    void testAutoProvisionCustomer() {
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.empty());
        when(customerRepository.findByUserId(any(UUID.class))).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Customer customer = customerService.getOrCreateCustomerForUser("ahmed_ali");

        assertThat(customer).isNotNull();
        assertThat(customer.getFullName()).isEqualTo("ahmed_ali");
        assertThat(customer.getUserAccountId()).isEqualTo(10L);
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should successfully update profile information")
    void testUpdateProfile() {
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.of(testCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Ahmed Ali Mohamed")
                .phoneNumber("01198765432")
                .build();

        CustomerDto updated = customerService.updateProfile("ahmed_ali", request);

        assertThat(updated).isNotNull();
        assertThat(updated.getFullName()).isEqualTo("Ahmed Ali Mohamed");
        assertThat(updated.getPhoneNumber()).isEqualTo("01198765432");
    }

    @Test
    @DisplayName("Should upsert delivery address cleanly")
    void testSaveOrUpdateAddress() {
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.of(testCustomer));
        when(customerAddressRepository.findByCustomer_UserId(testCustomer.getUserId())).thenReturn(Optional.of(testAddress));
        when(customerAddressRepository.save(any(CustomerAddress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddressDto newAddressDto = AddressDto.builder()
                .governorate("Giza")
                .cityArea("Dokki")
                .detailedAddress("15 Mosaddak St")
                .build();

        AddressDto saved = customerService.saveOrUpdateAddress("ahmed_ali", newAddressDto);

        assertThat(saved).isNotNull();
        assertThat(saved.getGovernorate()).isEqualTo("Giza");
        assertThat(saved.getCityArea()).isEqualTo("Dokki");
        assertThat(saved.getDetailedAddress()).isEqualTo("15 Mosaddak St");
    }

    @Test
    @DisplayName("Should successfully delete customer delivery address")
    void testDeleteAddress() {
        testCustomer.setAddress(testAddress);
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.of(testCustomer));
        doNothing().when(customerAddressRepository).deleteByCustomer_UserId(testCustomer.getUserId());

        customerService.deleteAddress("ahmed_ali");

        verify(customerAddressRepository, times(1)).deleteByCustomer_UserId(testCustomer.getUserId());
        assertThat(testCustomer.getAddress()).isNull();
    }

    @Test
    @DisplayName("Should auto-provision customer profile with preferred full name when provided")
    void testAutoProvisionCustomerWithPreferredFullName() {
        when(userRepository.findByUsername("ahmed_ali")).thenReturn(Optional.of(testUser));
        when(customerRepository.findByUserAccountId(testUser.getId())).thenReturn(Optional.empty());
        when(customerRepository.findByUserId(any(UUID.class))).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Customer customer = customerService.getOrCreateCustomerForUser("ahmed_ali", "Mohamed Saad");

        assertThat(customer).isNotNull();
        assertThat(customer.getFullName()).isEqualTo("Mohamed Saad");
        assertThat(customer.getUserAccountId()).isEqualTo(10L);
    }
}
