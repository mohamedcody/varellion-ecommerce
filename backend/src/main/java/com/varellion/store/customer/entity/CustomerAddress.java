package com.varellion.store.customer.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA Entity representing customer delivery address in public.customer_addresses.
 * In v1, there is a 1:1 relationship with a customer (enforced by UNIQUE constraint on customer_id).
 */
@Entity
@Table(name = "customer_addresses", schema = "public")
@Getter
@Setter
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "address_id", nullable = false, updatable = false)
    private UUID addressId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", referencedColumnName = "user_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "governorate", nullable = false)
    private String governorate;

    @Column(name = "city_area", nullable = false)
    private String cityArea;

    @Column(name = "detailed_address", nullable = false)
    private String detailedAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public CustomerAddress() {
    }

    @Builder
    public CustomerAddress(UUID addressId, Customer customer, String governorate, String cityArea, String detailedAddress, OffsetDateTime createdAt) {
        this.addressId = addressId;
        this.customer = customer;
        this.governorate = governorate;
        this.cityArea = cityArea;
        this.detailedAddress = detailedAddress;
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CustomerAddress that = (CustomerAddress) o;
        return addressId != null && Objects.equals(addressId, that.addressId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
