package com.varellion.store.customer.controller;

import com.varellion.store.common.response.ApiResponse;
import com.varellion.store.customer.dto.AddressDto;
import com.varellion.store.customer.dto.CustomerDto;
import com.varellion.store.customer.dto.UpdateProfileRequest;
import com.varellion.store.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * Retrieves the profile and saved delivery address for the authenticated customer.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        CustomerDto profile = customerService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Updates customer personal information (Full Name and Egyptian Phone Number).
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        CustomerDto updated = customerService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("تم تحديث الملف الشخصي بنجاح", updated));
    }

    /**
     * Saves or updates the primary delivery address for the authenticated customer (Upsert).
     */
    @PutMapping("/address")
    public ResponseEntity<ApiResponse<AddressDto>> saveOrUpdateAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddressDto addressDto) {
        AddressDto savedAddress = customerService.saveOrUpdateAddress(userDetails.getUsername(), addressDto);
        return ResponseEntity.ok(ApiResponse.success("تم حفظ عنوان الشحن بنجاح", savedAddress));
    }

    /**
     * Deletes the saved delivery address for the authenticated customer.
     */
    @DeleteMapping("/address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails) {
        customerService.deleteAddress(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("تم حذف عنوان الشحن بنجاح", null));
    }
}
