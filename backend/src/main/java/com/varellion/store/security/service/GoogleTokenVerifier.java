package com.varellion.store.security.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.varellion.store.security.dto.GoogleIdentity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.oauth.client-id:}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleIdentity verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                Boolean emailVerified = payload.getEmailVerified();
                if (emailVerified == null || !emailVerified) {
                    throw new IllegalArgumentException("Google account email is not verified.");
                }

                String subject = payload.getSubject();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                return new GoogleIdentity(subject, email, name);
            } else {
                throw new IllegalArgumentException("Invalid Google ID token signature or expired.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify Google ID token: {}", e.getMessage());
            throw new IllegalStateException("Failed to verify Google token: " + e.getMessage(), e);
        }
    }
}
