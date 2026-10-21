# دليل معمارية وإعدادات نظام الأمان (Security Architecture & Configuration Guide)
### مأخوذ ومُستخلص من معمارية مشروع JobFinder لتطبيقه في أي مشروع جديد (Spring Boot + JWT + Rate Limiting + Google OAuth)

---

## 📌 الفهرس
1. [معمارية نظام الأمان ومسار الطلب (Request Flow)](#1-معمارية-نظام-الأمان-ومسار-الطلب-request-flow)
2. [الاعتماديات والمكتبات المطلوبة (pom.xml)](#2-الاعتماديات-والمكتبات-المطلوبة-pomxml)
3. [متغيرات البيئة وملف الإعدادات (application.properties & .env)](#3-متغيرات-البيئة-وملف-الإعدادات-applicationproperties--env)
4. [طبقة الفلاتر (Security Filters Layer)](#4-طبقة-الفلاتر-security-filters-layer)
   - [أ. فلتر تحديد معدل الطلبات (RateLimitFilter)](#أ-فلتر-تحديد-معدل-الطلبات-ratelimitfilter)
   - [ب. فلتر التحقق من التوكن (JwtAuthenticationFilter)](#ب-فلتر-التحقق-من-التوكن-jwtauthenticationfilter)
5. [خدمة إدارة وتوليد الـ JWT (JwtService)](#5-خدمة-إدارة-وتوليد-الـ-jwt-jwtservice)
6. [إعدادات Spring Security الرئيسية](#6-إعدادات-spring-security-الرئيسية)
   - [أ. SecurityConfig (الـ Filter Chain وهيدرز الحماية)](#أ-securityconfig-الـ-filter-chain-وهيدرز-الحماية)
   - [ب. CorsConfig (إعدادات الـ CORS)](#ب-corsconfig-إعدادات-الـ-cors)
   - [ج. ApplicationConfig (الـ PasswordEncoder والـ Providers)](#ج-applicationconfig-الـ-passwordencoder-والـ-providers)
7. [طبقة المستخدم والمصادقة (UserDetails & User Entity)](#7-طبقة-المستخدم-والمصادقة-userdetails--user-entity)
   - [أ. CustomUserDetails](#أ-customuserdetails)
   - [ب. CustomUserDetailsService](#ب-customuserdetailsservice)
   - [ج. الحقول الأساسية في كيان المستخدم (User Entity)](#ج-الحقول-الأساسية-في-كيان-المستخدم-user-entity)
8. [آلية الحماية من الهجمات التخمينية (Account Lockout & Refresh Flow)](#8-آلية-الحماية-من-الهجمات-التخمينية-account-lockout--refresh-flow)
9. [تسجيل الدخول عبر جوجل (Google Login بدون جدول إضافي)](#9-تسجيل-الدخول-عبر-جوجل-google-login-بدون-جدول-إضافي)
10. [خطوات تطبيق النظام في مشروع جديد من الصفر (Checklist)](#10-خطوات-تطبيق-النظام-في-مشروع-جديد-من-الصفر-checklist)

---

## 1. معمارية نظام الأمان ومسار الطلب (Request Flow)

يعتمد النظام على نمط **Stateless REST Security**، حيث لا يتم تخزين أي Sessions في الذاكرة (SessionCreationPolicy.STATELESS).

```mermaid
flowchart TD
    Client["Client (Frontend / Mobile)"] -->|HTTP Request| RateLimitFilter["1. RateLimitFilter (IP-based Limiter)"]
    
    RateLimitFilter -->|تجاوز الحد (429 Too Many Requests)| Blocked["رفض الطلب فوراً بنمط JSON"]
    RateLimitFilter -->|ضمن الحد المسموح| CorsSecurityHeaders["2. CORS & Security Headers (CSP, HSTS, Frame-Options)"]
    
    CorsSecurityHeaders -->|مسار مفتوح (/api/auth/**)| AuthEndpoints["Controllers (/api/auth/login, etc.)"]
    CorsSecurityHeaders -->|مسار محمي| JwtFilter["3. JwtAuthenticationFilter"]
    
    JwtFilter -->|فحص Header: Authorization Bearer| TokenCheck{"هل التوكن سليم وغير منتهي؟"}
    TokenCheck -->|لا / غير موجود| SecurityContextEmpty["SecurityContext يظل فارغاً"]
    TokenCheck -->|نعم| LoadUser["تحميل بيانات المستخدم والتحقق من عدم قفل الحساب"]
    LoadUser --> SetContext["حقن المستخدم داخل SecurityContextHolder"]
    
    SetContext --> SecurityFilterChain["4. SecurityFilterChain (Authorization Rules)"]
    SecurityContextEmpty --> SecurityFilterChain
    
    SecurityFilterChain -->|مصرح له (Has Role / Authenticated)| Controllers["5. Controller Endpoint"]
    SecurityFilterChain -->|غير مصرح له (401 / 403)| AccessDenied["401 Unauthorized / 403 Forbidden"]
```

---

## 2. الاعتماديات والمكتبات المطلوبة (pom.xml)

ضع الاعتماديات التالية في ملف `pom.xml` الخاص بمشروع Spring Boot:

```xml
<dependencies>
    <!-- 1. Spring Security Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- 2. Validation Starter (لإجراء الفحص على المدخلات مثل @NotBlank, @Email) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- 3. مكتبات JJWT للتعامل مع الـ JSON Web Tokens -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- 4. مكتبة Google API Client (للتحقق من توكن جوجل في السيرفر) -->
    <dependency>
        <groupId>com.google.api-client</groupId>
        <artifactId>google-api-client</artifactId>
        <version>2.7.0</version>
    </dependency>
</dependencies>
```

---

## 3. متغيرات البيئة وملف الإعدادات (application.properties & .env)

### في ملف `application.properties`:
```properties
# ==========================================
# إعدادات الأمان والـ JWT
# ==========================================
# مفتاح سري قوي مشفر بنظام Base64 بطول 256 بت على الأقل
jwt.secret=${JWT_SECRET}

# صلاحية Access Token: 15 دقيقة (900000 مللي ثانية)
jwt.expiration=900000

# صلاحية Refresh Token: 7 أيام (604800000 مللي ثانية)
jwt.refresh-expiration=604800000

# ==========================================
# عنوان الفرونت إند المسموح له بالـ CORS
# ==========================================
FRONTEND_URL=${FRONTEND_URL:http://localhost:3000}

# ==========================================
# Google OAuth Client ID
# ==========================================
google.oauth.client-id=${GOOGLE_CLIENT_ID}

# ==========================================
# حماية Actuator (عدم إظهار تفاصيل النظام للمخترقين)
# ==========================================
management.endpoint.health.show-details=never
```

### في ملف `.env`:
```env
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
FRONTEND_URL=http://localhost:3000,https://myfrontend.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 4. طبقة الفلاتر (Security Filters Layer)

### أ. فلتر تحديد معدل الطلبات (RateLimitFilter)
**الهدف:** منع هجمات الـ Brute Force وحماية موارد السيرفر بدون الحاجة لخادم Redis في المراحل الأولى (باستخدام `ConcurrentHashMap` ونافذة زمنية دقيقة بـ Lazy Expiration).

```java
package yourproject.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT_PER_MINUTE = 20; // 20 طلب في الدقيقة لمسارات المصادقة
    private static final int EXPENSIVE_LIMIT_PER_MINUTE = 5; // 5 طلبات في الدقيقة للعمليات الثقيلة (AI / Upload)
    private static final long WINDOW_MS = 60_000L; // نافذة 60 ثانية

    private final ConcurrentHashMap<String, RateLimitEntry> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String bucketType = null;
        int limit = AUTH_LIMIT_PER_MINUTE;

        if (path.startsWith("/api/auth")) {
            bucketType = "AUTH";
            limit = AUTH_LIMIT_PER_MINUTE;
        } else if (path.startsWith("/api/upload") || path.startsWith("/api/ai")) {
            bucketType = "EXPENSIVE";
            limit = EXPENSIVE_LIMIT_PER_MINUTE;
        }

        // إذا لم يكن المسار ضمن المسارات المحددة، يُترك ليمر مباشرة
        if (bucketType == null || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = request.getRemoteAddr();
        String bucketKey = clientIp + ":" + bucketType;
        long now = System.currentTimeMillis();

        RateLimitEntry entry = requestCounts.compute(bucketKey, (key, existing) -> {
            if (existing == null || (now - existing.windowStart) > WINDOW_MS) {
                return new RateLimitEntry(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        // في حال تجاوز الحد المسموح: يتم الرد مباشرة بكود 429 وإيقاف الطلب
        if (entry.count.get() > limit) {
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorBody = Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", "You have exceeded the rate limit. Please try again after 1 minute.",
                    "path", path
            );

            new ObjectMapper().writeValue(response.getOutputStream(), errorBody);
            return; // إنهاء السلسلة هنا وعدم المتابعة
        }

        filterChain.doFilter(request, response);
    }

    private static class RateLimitEntry {
        final long windowStart;
        final AtomicInteger count;

        RateLimitEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
```

---

### ب. فلتر التحقق من التوكن (JwtAuthenticationFilter)
**الهدف:** فحص الهيدر `Authorization: Bearer <token>` في كل طلب، استخراج المستخدم، والتحقق من صحة التوكن ووضعه في `SecurityContextHolder`.

```java
package yourproject.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import yourproject.util.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // إذا لم يكن الهيدر موجوداً أو لا يبدأ بـ Bearer، نترك الفلتر يمر للفلتر التالي
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String userEmail;

        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception ex) {
            // في حال كان التوكن تالفاً أو لا يمكن قراءته
            filterChain.doFilter(request, response);
            return;
        }

        // إذا تم استخراج الإيميل ولم يكن الطلب مصدقاً بالفعل في السياق الحالي
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails;
            try {
                userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            } catch (Exception ex) {
                filterChain.doFilter(request, response);
                return;
            }

            // التأكد من أن التوكن صالح وأن نوعه هو ACCESS token حصراً
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // تعيين المستخدم كمصادق داخل سياق الأمان لهذا الطلب
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## 5. خدمة إدارة وتوليد الـ JWT (JwtService)

تتميز هذه الخدمة بفصل صارم بين نوعين من الرموز عبر Claim مخصص باسم `token_type`:
1. `ACCESS`: لا يُقبل إلا للوصول للـ Endpoints المحمية، مدته قصيرة (15 دقيقة).
2. `REFRESH`: لا يُقبل في الـ JwtAuthFilter العادي بل يُستخدم فقط لتجديد التوكن في `/api/auth/refresh`.

```java
package yourproject.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String ACCESS_TOKEN_TYPE = "ACCESS";
    private static final String REFRESH_TOKEN_TYPE = "REFRESH";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:900000}") // 15 mins
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}") // 7 days
    private long refreshExpiration;

    private Key signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // توليد Access Token
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // توليد Refresh Token
    public String generateRefreshToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // التحقق من صحة Access Token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return isTokenType(token, ACCESS_TOKEN_TYPE)
                && (username.equals(userDetails.getUsername()))
                && !isTokenExpired(token);
    }

    // التحقق من صحة Refresh Token
    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return isTokenType(token, REFRESH_TOKEN_TYPE)
                && (username.equals(userDetails.getUsername()))
                && !isTokenExpired(token);
    }

    private boolean isTokenType(String token, String expectedType) {
        return expectedType.equals(extractClaim(token, claims -> claims.get(TOKEN_TYPE_CLAIM, String.class)));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
```

---

## 6. إعدادات Spring Security الرئيسية

### أ. SecurityConfig (الـ Filter Chain وهيدرز الحماية)

```java
package yourproject.config;

import yourproject.filter.JwtAuthenticationFilter;
import yourproject.filter.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. تفعيل الـ CORS وتعطيل الـ CSRF (لأن الـ API يعتمد على Tokens عديمة الحالة Stateless)
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)

                // 2. هيدرز الأمان الصارمة لحماية المتصفح (Security Headers)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny()) // منع هجمات Clickjacking
                        .xssProtection(xss -> xss.disable()) // إيقاف الفلتر القديم واستبداله بـ CSP الحديثة
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none';"))
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)) // إجبار HTTPS لسنة كاملة
                )

                // 3. قواعد الأذونات وصلاحيات المسارات
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ASYNC).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        
                        // المسارات العامة المفتوحة للجميع
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // لوحة التحكم والتوثيق للمسؤولين فقط (Admin)
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").hasRole("ADMIN")

                        // أي طلب آخر يتطلب مصادقة (JWT صالح)
                        .anyRequest().authenticated()
                )

                // 4. جعل الجلسة عديمة الحالة تماماً
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authenticationProvider(authenticationProvider)

                // 5. ترتيب الفلاتر:
                // فلتر معدل الطلبات في البداية تماماً
                .addFilterBefore(rateLimitFilter, org.springframework.security.web.authentication.logout.LogoutFilter.class)
                // فلتر الـ JWT قبل فلتر اسم المستخدم وكلمة السر
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

### ب. CorsConfig (إعدادات الـ CORS)

يدعم قراءة أكثر من دومين مفصولين بفاصلة `,` من متغيرات البيئة، ويسمح بالـ Cookies مع `allowCredentials(true)`.

```java
package yourproject.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                String[] origins = Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toArray(String[]::new);

                registry.addMapping("/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

---

### ج. ApplicationConfig (الـ PasswordEncoder والـ Providers)

```java
package yourproject.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserDetailsService userDetailsService;

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // تشفير قوي لكلمات السر باستخدام BCrypt
        return new BCryptPasswordEncoder();
    }
}
```

---

## 7. طبقة المستخدم والمصادقة (UserDetails & User Entity)

### أ. CustomUserDetails

```java
package yourproject.config;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Long id, String username, String password, boolean enabled,
                             boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.accountNonLocked = accountNonLocked;
        this.authorities = authorities;
    }

    public Long getId() { return id; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override
    public String getPassword() { return password; }
    @Override
    public String getUsername() { return username; }
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return accountNonLocked; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return enabled; }
}
```

---

### ب. CustomUserDetailsService
يبحث عن المستخدم إما عن طريق **اسم المستخدم** أو عن طريق **البريد الإلكتروني**:

```java
package yourproject.config;

import yourproject.model.entity.User;
import yourproject.repository.UserRepository;
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
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole());

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
```

---

### ج. الحقول الأساسية في كيان المستخدم (User Entity)
لضمان عمل نظام الحماية والـ Lockout بنجاح، يجب أن يحتوي جدول `User` على الحقول التالية:

```java
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 150)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String role; // "USER", "ADMIN"

    @Column(nullable = false)
    private boolean enabled = false; // تفعيل الحساب بعد تأكيد الإيميل

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "failed_attempts", nullable = false)
    private Integer failedAttempts = 0; // عداد المحاولات الفاشلة

    @Column(name = "lockout_time")
    private LocalDateTime lockoutTime; // وقت انتهاء القفل التلقائي
}
```

---

## 8. آلية الحماية من الهجمات التخمينية (Account Lockout & Refresh Flow)

### 1. معالجة المحاولات الفاشلة في `AuthService.login()`:
- عند إدخال كلمة سر خاطئة:
  1. زيادة `failedAttempts` بمقدار 1.
  2. إذا وصل العداد إلى 5 محاولات: يتم ضبط `lockoutTime = LocalDateTime.now().plusMinutes(15)`، ويتم قفل الحساب لمدة 15 دقيقة.
- عند تسجيل الدخول بنجاح:
  1. تصفير العداد: `failedAttempts = 0`.
  2. مسح القفل: `lockoutTime = null`.

### 2. إرجاع الـ Refresh Token في Secure HttpOnly Cookie في الـ Controller:
```java
@PostMapping("/login")
public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequest request) {
    AuthResponseDto response = authService.login(request);

    // حماية الـ Refresh Token من هجمات XSS بتخزينه داخل كوكيز مشفرة HttpOnly
    ResponseCookie cookie = ResponseCookie.from("refresh_token", response.refreshToken())
            .httpOnly(true)
            .secure(true) // في الإنتاج مع HTTPS
            .path("/")
            .maxAge(7 * 24 * 60 * 60) // 7 أيام
            .sameSite("Lax")
            .build();

    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(response);
}
```

---

## 9. تسجيل الدخول عبر جوجل (Google Login بدون جدول إضافي)

في هذا النظام، **لا نحتاج لإنشاء أي جدول إضافي لقاعدة البيانات** (بدون جدول `oauth_providers` أو `social_accounts`). بدلاً من ذلك:
1. يرسل الفرونت إند الـ `idToken` الصادر من Google Identity Services.
2. يتحقق السيرفر عبر Google SDK الرسمية من صحة التوكن وأن الإيميل موثق (`email_verified == true`).
3. يبحث السيرفر في جدول `User` العادي:
   - إذا وجد المستخدم: يسجل دخوله مباشرة.
   - إذا كان مستخدماً جديداً: ينشئ سجلاً في جدول `User` بكلمة سر عشوائية قوية وحالة مفعلة `enabled = true` فوراً.

### أ. كلاس التحقق من توكن جوجل (`GoogleTokenVerifier.java`):

```java
package yourproject.services.assets;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

public record GoogleIdentity(String subject, String email, String name) {}

@Service
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${google.oauth.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
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
                    throw new RuntimeException("Google email is not verified.");
                }

                String subject = payload.getSubject();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                return new GoogleIdentity(subject, email, name);
            } else {
                throw new RuntimeException("Invalid Google ID token.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Google token: " + e.getMessage());
        }
    }
}
```

### ب. منطق المصادقة بدون جداول إضافية في `AuthService.java`:

```java
public record GoogleLoginRequest(@jakarta.validation.constraints.NotBlank String idToken) {}

@Transactional
public AuthResponseDto googleLogin(GoogleLoginRequest request) {
    // 1. التحقق من التوكن مع سيرفرات جوجل واستخراج الهوية
    GoogleIdentity identity = googleTokenVerifier.verify(request.idToken());

    if (identity.email() == null || identity.email().isEmpty()) {
        throw new RuntimeException("Google identity does not contain an email");
    }

    // 2. البحث في جدول المستخدمين العادي أو إنشاء مستخدم جديد دون أي جدول إضافي
    User user = userRepository.findByEmail(identity.email())
            .orElseGet(() -> {
                User newUser = User.builder()
                        .username(identity.email().split("@")[0] + "_" + (int)(Math.random() * 10000))
                        .email(identity.email())
                        .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString())) // كلمة سر عشوائية مشفرة
                        .role("USER")
                        .enabled(true)
                        .emailVerified(true)
                        .failedAttempts(0)
                        .build();
                return userRepository.save(newUser);
            });

    if (!user.isEnabled()) {
        throw new RuntimeException("Account is disabled");
    }

    // 3. إصدار Access Token و Refresh Token كأي مستخدم طبيعي
    UserDetails details = customUserDetailsService.loadUserByUsername(user.getEmail());
    String accessToken = jwtService.generateToken(details);
    String refreshToken = jwtService.generateRefreshToken(details);

    return new AuthResponseDto(accessToken, refreshToken, user.getEmail(), user.getRole(), "Google Login Successful");
}
```

---

## 10. خطوات تطبيق النظام في مشروع جديد من الصفر (Checklist)

عند إنشاء مشروعك الجديد، اتبع الخطوات التالية بالترتيب:

- [ ] **الخطوة 1: تثبيت الـ Dependencies**: أضف `spring-boot-starter-security` و `jjwt` و `google-api-client` في `pom.xml`.
- [ ] **الخطوة 2: إعداد الـ Properties**: انسخ مفاتيح الـ JWT (`jwt.secret`, `jwt.expiration`, `jwt.refresh-expiration`) و `FRONTEND_URL` في `application.properties`.
- [ ] **الخطوة 3: إنشاء الكيانات (Entities)**: تأكد من احتواء كيان `User` على حقول `failedAttempts`, `lockoutTime`, `enabled`, `role`.
- [ ] **الخطوة 4: نسخ الكلاسات الأساسية**:
  - `JwtService.java`
  - `RateLimitFilter.java`
  - `JwtAuthenticationFilter.java`
  - `CustomUserDetails.java` & `CustomUserDetailsService.java`
  - `ApplicationConfig.java` & `CorsConfig.java`
  - `SecurityConfig.java`
- [ ] **الخطوة 5: التحقق من الترتيب**: تأكد في `SecurityConfig` أن `rateLimitFilter` يسبق الجميع، وأن `jwtAuthFilter` يسبق `UsernamePasswordAuthenticationFilter`.
- [ ] **الخطوة 6: حماية التوكنات في الفرونت إند**: اجعل الفرونت إند يحفظ الـ `accessToken` في الذاكرة (Memory/State) أو Session، واستقبل الـ `refreshToken` عبر HttpOnly Cookie تلقائياً لتفادي ثغرات XSS.
