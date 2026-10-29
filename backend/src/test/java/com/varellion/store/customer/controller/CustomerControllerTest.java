package com.varellion.store.customer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.customer.dto.AddressDto;
import com.varellion.store.customer.dto.CustomerDto;
import com.varellion.store.customer.dto.UpdateProfileRequest;
import com.varellion.store.customer.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UserDetails mockUserDetails = new User(
            "test_user",
            "password",
            Collections.emptyList()
    );

    @BeforeEach
    void setUp() {
        // Custom argument resolver to inject @AuthenticationPrincipal in standalone MockMvc
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter,
                                          ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest,
                                          WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/customer/profile should return 200 and customer profile")
    void testGetProfileSuccess() throws Exception {
        CustomerDto mockDto = CustomerDto.builder()
                .userId(UUID.randomUUID())
                .fullName("Test Customer")
                .username("test_user")
                .email("test@varellion.com")
                .phoneNumber("01012345678")
                .isActive(true)
                .build();

        when(customerService.getProfile("test_user")).thenReturn(mockDto);

        mockMvc.perform(get("/api/customer/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Test Customer"))
                .andExpect(jsonPath("$.data.phoneNumber").value("01012345678"));
    }

    @Test
    @DisplayName("PUT /api/customer/profile with valid payload should return 200")
    void testUpdateProfileSuccess() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("New Name")
                .phoneNumber("01234567890")
                .build();

        CustomerDto updated = CustomerDto.builder()
                .fullName("New Name")
                .phoneNumber("01234567890")
                .build();

        when(customerService.updateProfile(eq("test_user"), any(UpdateProfileRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/customer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("New Name"));
    }

    @Test
    @DisplayName("PUT /api/customer/profile with invalid Egyptian phone should return 400 Bad Request")
    void testUpdateProfileInvalidPhone() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Valid Name")
                .phoneNumber("12345") // Invalid Egyptian phone format
                .build();

        mockMvc.perform(put("/api/customer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/customer/address with valid address should return 200")
    void testSaveOrUpdateAddressSuccess() throws Exception {
        AddressDto addressDto = AddressDto.builder()
                .governorate("Alexandria")
                .cityArea("Smouha")
                .detailedAddress("Building 12, Victor Emanuel Square")
                .build();

        when(customerService.saveOrUpdateAddress(eq("test_user"), any(AddressDto.class)))
                .thenReturn(addressDto);

        mockMvc.perform(put("/api/customer/address")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.governorate").value("Alexandria"));
    }

    @Test
    @DisplayName("PUT /api/customer/address with empty fields should return 400 Bad Request")
    void testSaveOrUpdateAddressInvalid() throws Exception {
        AddressDto addressDto = AddressDto.builder()
                .governorate("") // Blank governorate
                .cityArea("Smouha")
                .detailedAddress("Short") // Too short (<5 chars)
                .build();

        mockMvc.perform(put("/api/customer/address")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressDto)))
                .andExpect(status().isBadRequest());
    }
}
