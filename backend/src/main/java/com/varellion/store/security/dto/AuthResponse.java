package com.varellion.store.security.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String refreshToken;
    private String email;
    private String username;
    private String role;
    private String message;

    public AuthResponse(String accessToken, String refreshToken, String email, String role, String message) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.email = email;
        this.role = role;
        this.message = message;
    }
}
