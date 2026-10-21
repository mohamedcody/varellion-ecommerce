package com.varellion.store.security.service;

import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));

        // التحقق مما إذا كان الحساب مقفولاً بسبب محاولات دخول خاطئة
        boolean isNotLocked = user.getLockoutTime() == null ||
                user.getLockoutTime().isBefore(LocalDateTime.now());

        // إضافة بادئة ROLE_ للأدوار في Spring Security
        String roleName = user.getRole() != null && user.getRole().startsWith("ROLE_")
                ? user.getRole()
                : "ROLE_" + (user.getRole() != null ? user.getRole() : "USER");
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleName);

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.isEnabled(),
                isNotLocked,
                List.of(authority)
        );
    }
}
