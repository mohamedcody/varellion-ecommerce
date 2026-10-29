package com.varellion.store.customer.repository;

import com.varellion.store.customer.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    Optional<CustomerAddress> findByCustomer_UserId(UUID userId);
    void deleteByCustomer_UserId(UUID userId);
}
