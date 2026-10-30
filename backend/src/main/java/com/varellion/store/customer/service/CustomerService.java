package com.varellion.store.customer.service;

import com.varellion.store.common.exception.ResourceNotFoundException;
import com.varellion.store.customer.dto.AddressDto;
import com.varellion.store.customer.dto.CustomerDto;
import com.varellion.store.customer.dto.UpdateProfileRequest;
import com.varellion.store.customer.entity.Customer;
import com.varellion.store.customer.entity.CustomerAddress;
import com.varellion.store.customer.repository.CustomerAddressRepository;
import com.varellion.store.customer.repository.CustomerRepository;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final UserRepository userRepository;

    /**
     * Resolves the authenticated User and ensures a linked Customer profile exists.
     */
    @Transactional
    public Customer getOrCreateCustomerForUser(String usernameOrEmail) {
        return getOrCreateCustomerForUser(usernameOrEmail, null);
    }

    /**
     * Resolves the authenticated User and ensures a linked Customer profile exists with an optional preferred full name.
     */
    @Transactional
    public Customer getOrCreateCustomerForUser(String usernameOrEmail, String preferredFullName) {
        User user = findUser(usernameOrEmail);
        return getOrCreateCustomerForUser(user, preferredFullName);
    }

    /**
     * Ensures a linked Customer profile exists for the given User entity.
     */
    @Transactional
    public Customer getOrCreateCustomerForUser(User user, String preferredFullName) {
        UUID customerUUID = deriveCustomerUUID(user);

        return customerRepository.findByUserAccountId(user.getId())
                .or(() -> customerRepository.findByUserId(customerUUID))
                .map(existing -> {
                    if (existing.getUserAccountId() == null && user.getId() != null) {
                        existing.setUserAccountId(user.getId());
                        return customerRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("Auto-provisioning Customer profile for user: {} (ID: {})", user.getUsername(), user.getId());
                    String initialFullName = (preferredFullName != null && !preferredFullName.isBlank())
                            ? preferredFullName.trim()
                            : user.getUsername();

                    Customer newCustomer = Customer.builder()
                            .userId(customerUUID)
                            .userAccountId(user.getId())
                            .fullName(initialFullName)
                            .phoneNumber(null)
                            .isActive(true)
                            .build();

                    try {
                        return customerRepository.save(newCustomer);
                    } catch (DataIntegrityViolationException ex) {
                        log.warn("Concurrent Customer profile creation detected for user ID {}. Falling back to lookup.", user.getId());
                        return customerRepository.findByUserAccountId(user.getId())
                                .or(() -> customerRepository.findByUserId(customerUUID))
                                .orElseThrow(() -> ex);
                    }
                });
    }

    /**
     * Retrieves the profile and saved delivery address for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public CustomerDto getProfile(String usernameOrEmail) {
        User user = findUser(usernameOrEmail);

        UUID customerUUID = deriveCustomerUUID(user);
        Customer customer = customerRepository.findByUserAccountId(user.getId())
                .or(() -> customerRepository.findByUserId(customerUUID))
                .orElseGet(() -> Customer.builder()
                        .userId(customerUUID)
                        .userAccountId(user.getId())
                        .fullName(user.getUsername())
                        .isActive(true)
                        .build()
                );

        CustomerAddress address = customerAddressRepository.findByCustomer_UserId(customer.getUserId()).orElse(null);

        return mapToDto(customer, user, address);
    }

    /**
     * Updates personal contact information (Full Name and Phone Number).
     */
    @Transactional
    public CustomerDto updateProfile(String usernameOrEmail, UpdateProfileRequest request) {
        User user = findUser(usernameOrEmail);
        Customer customer = getOrCreateCustomerForUser(user, null);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            customer.setFullName(request.getFullName().trim());
        }

        if (request.getPhoneNumber() != null) {
            customer.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }

        Customer saved = customerRepository.save(customer);
        CustomerAddress address = customerAddressRepository.findByCustomer_UserId(saved.getUserId()).orElse(null);

        return mapToDto(saved, user, address);
    }

    /**
     * Upsert delivery address (1:1 address per customer in V1).
     * If an address exists, it updates it. Otherwise, it creates a new record.
     */
    @Transactional
    public AddressDto saveOrUpdateAddress(String usernameOrEmail, AddressDto addressDto) {
        Customer customer = getOrCreateCustomerForUser(usernameOrEmail);

        CustomerAddress address = customerAddressRepository.findByCustomer_UserId(customer.getUserId())
                .orElseGet(() -> CustomerAddress.builder()
                        .customer(customer)
                        .build()
                );

        address.setGovernorate(addressDto.getGovernorate().trim());
        address.setCityArea(addressDto.getCityArea().trim());
        address.setDetailedAddress(addressDto.getDetailedAddress().trim());

        CustomerAddress saved = customerAddressRepository.save(address);

        return AddressDto.builder()
                .addressId(saved.getAddressId())
                .governorate(saved.getGovernorate())
                .cityArea(saved.getCityArea())
                .detailedAddress(saved.getDetailedAddress())
                .build();
    }

    /**
     * Deletes the saved delivery address for the authenticated customer.
     */
    @Transactional
    public void deleteAddress(String usernameOrEmail) {
        Customer customer = getOrCreateCustomerForUser(usernameOrEmail);
        customerAddressRepository.deleteByCustomer_UserId(customer.getUserId());
        customer.setAddress(null);
    }

    private User findUser(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + usernameOrEmail));
    }

    /**
     * Deterministically derives a UUID from the internal User ID to guarantee 1:1 mapping with public.customers.
     */
    public UUID deriveCustomerUUID(User user) {
        return UUID.nameUUIDFromBytes(("varellion_user_" + user.getId()).getBytes(StandardCharsets.UTF_8));
    }

    private CustomerDto mapToDto(Customer customer, User user, CustomerAddress address) {
        AddressDto addressDto = null;
        if (address != null) {
            addressDto = AddressDto.builder()
                    .addressId(address.getAddressId())
                    .governorate(address.getGovernorate())
                    .cityArea(address.getCityArea())
                    .detailedAddress(address.getDetailedAddress())
                    .build();
        }

        return CustomerDto.builder()
                .userId(customer.getUserId())
                .fullName(customer.getFullName())
                .phoneNumber(customer.getPhoneNumber())
                .email(user != null ? user.getEmail() : null)
                .username(user != null ? user.getUsername() : null)
                .isActive(customer.getIsActive())
                .address(addressDto)
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
