package com.varellion.store.customer.repository;

import com.varellion.store.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByUserId(UUID userId);
    Optional<Customer> findByUserAccountId(Long userAccountId);

    @Query(value = """
        SELECT c FROM Customer c
        LEFT JOIN FETCH c.address
        WHERE (CAST(:search AS string) IS NULL OR (
            LOWER(c.fullName) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
            c.phoneNumber LIKE CONCAT('%', CAST(:search AS string), '%')
        ))
    """,
    countQuery = """
        SELECT COUNT(c) FROM Customer c
        WHERE (CAST(:search AS string) IS NULL OR (
            LOWER(c.fullName) LIKE CONCAT('%', LOWER(CAST(:search AS string)), '%') OR
            c.phoneNumber LIKE CONCAT('%', CAST(:search AS string), '%')
        ))
    """)
    Page<Customer> findAdminCustomers(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.address WHERE c.userId = :userId")
    Optional<Customer> findByIdWithAddress(@Param("userId") UUID userId);
}
