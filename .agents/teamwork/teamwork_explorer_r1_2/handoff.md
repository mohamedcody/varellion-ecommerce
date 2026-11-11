# Technical Investigation Report: AdminOrderController, Spring Security & GlobalExceptionHandler

## 1. Observation

### 1.1. AdminOrderController Current State
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`
- **Class Annotations** (lines 17–21):
  ```java
  @RestController
  @RequestMapping("/api/admin/orders")
  @RequiredArgsConstructor
  @PreAuthorize("hasRole('ADMIN')")
  public class AdminOrderController {
  ```
- **Method Signature & Body** (lines 32–43):
  ```java
  @PutMapping("/{orderNumber}/status")
  public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
          @PathVariable String orderNumber,
          @Valid @RequestBody UpdateOrderStatusRequest request
  ) {
      OrderResponseDto updated = orderService.updateOrderStatus(
              orderNumber,
              request.getNewStatus(),
              request.getReason()
      );
      return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة الطلب بنجاح", updated));
  }
  ```
- **Direct Observations**:
  1. The class lacks `@Slf4j` (no logger defined or imported).
  2. The class lacks `@Validated` (method parameter constraints on `@PathVariable` will not be triggered by Spring's validation interceptor).
  3. `@PathVariable String orderNumber` has no validation annotations (no regex or pattern constraint).
  4. The method does not access or extract the authenticated admin user/actor from Spring Security context.
  5. The method performs no audit logging.
  6. The method calls the 3-parameter overload `orderService.updateOrderStatus(orderNumber, request.getNewStatus(), request.getReason())`.

### 1.2. Spring Security Authentication & Actor Identity Representation
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/jwt/JwtAuthenticationFilter.java`
  - In `doFilterInternal` (lines 68–75):
    ```java
    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails,
            null,
            userDetails.getAuthorities());
    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authToken);
    ```
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/service/CustomUserDetailsService.java`
  - In `loadUserByUsername` (lines 37–44):
    ```java
    return new CustomUserDetails(
            user.getId(),
            user.getEmail(),
            user.getPassword(),
            user.isEnabled(),
            isNotLocked,
            List.of(authority)
    );
    ```
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/service/CustomUserDetails.java`
  - Fields (lines 10–15):
    ```java
    private final Long id;
    private final String username; // holds user.getEmail()
    private final String password;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;
    ```
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/security/entity/User.java`
  - Primary key (lines 19–21):
    ```java
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    ```
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/order/entity/OrderStatusHistory.java`
  - Target field for actor (lines 41–42):
    ```java
    @Column(name = "actor_id")
    private UUID actorId;
    ```
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/resources/db/migration/V10__cleanup_legacy_auth_and_indexes.sql`
  - Line 11–12:
    ```sql
    ALTER TABLE public.order_status_history
        DROP CONSTRAINT IF EXISTS order_status_history_actor_id_fkey;
    ```
- **Direct Observations on Identity**:
  1. In production runtime, `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` is an instance of `CustomUserDetails`.
  2. `CustomUserDetails.getId()` is a `Long` (`user_account_id` / `users.id`), NOT a `UUID`.
  3. `CustomUserDetails.getUsername()` and `authentication.getName()` return the admin's email `String` (e.g., `admin@varellion.com`).
  4. In unit and slice tests using `@WithMockUser(username = "admin@varellion.com", roles = "ADMIN")`, the principal is Spring's standard `org.springframework.security.core.userdetails.User`, NOT `CustomUserDetails`. Directly casting `auth.getPrincipal()` to `CustomUserDetails` will throw a fatal `ClassCastException` in test environments.
  5. In standalone MockMvc tests without security context, `SecurityContextHolder.getContext().getAuthentication()` and method parameter `Authentication` can be `null`.
  6. The database column `order_status_history.actor_id` is a nullable `UUID`, and the legacy foreign key constraint to `auth.users(id)` was explicitly dropped in migration `V10`.

### 1.3. GlobalExceptionHandler Current State
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
- Existing handlers:
  1. `BusinessException.class` (lines 25–36): Returns `ResponseEntity<ErrorResponse>` with `status = ex.getStatus().value()` (default 400 Bad Request), `error = ex.getStatus().getReasonPhrase()`, `message = ex.getMessage()`.
  2. `ResourceNotFoundException.class` (lines 38–49): Returns 404 Not Found.
  3. `HttpMessageNotReadableException.class` (lines 51–62): Returns 400 Bad Request ("تنسيق البيانات المرسلة غير صالح").
  4. `IllegalArgumentException.class` (lines 64–75): Returns 400 Bad Request with `message = ex.getMessage()`.
  5. `MethodArgumentNotValidException.class` (lines 77–93): Returns 400 Bad Request with `error = "Validation Failed"`, `validationErrors = Map<String, String>`.
  6. `BadCredentialsException.class` (lines 95–105): Returns 401 Unauthorized.
  7. `LockedException.class` (lines 107–117): Returns 423 Locked.
  8. `MissingServletRequestParameterException.class` (lines 119–130): Returns 400 Bad Request.
  9. `Exception.class` (lines 132–143): Fallback returning 500 Internal Server Error.
- **Direct Observations on Exception Handling**:
  1. There is NO handler for `jakarta.validation.ConstraintViolationException`!
  2. If validation on a method parameter (`@PathVariable`) fails when `@Validated` is active, Spring throws `ConstraintViolationException`.
  3. Because `ConstraintViolationException` is unhandled, it falls through to `handleGeneralException(Exception.class)`, producing an HTTP `500 Internal Server Error` instead of `400 Bad Request`.
  4. `ErrorResponse` (in `com.varellion.store.common.response.ErrorResponse`) is the established standard error envelope for all REST errors in this project, containing `timestamp`, `status`, `error`, `message`, `path`, and `validationErrors`.
  5. State transition validation in `OrderService` can throw `BusinessException` (with default HTTP 400) or `IllegalArgumentException`. Both are already handled by `GlobalExceptionHandler` and return HTTP 400 with `ErrorResponse`.

### 1.4. Existing Controller Tests
- **File**: `/home/mohamed-saad/Desktop/BRAND/backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java`
- Lines 48–51:
  ```java
  mockMvc = MockMvcBuilders.standaloneSetup(adminOrderController)
          .setControllerAdvice(new GlobalExceptionHandler())
          .build();
  ```
- Lines 88–91:
  ```java
  when(orderService.updateOrderStatus(eq("VAR-20261028-0001"), eq(OrderStatus.SHIPPED), eq("تم تسليم الشحنة لشركة الشحن")))
          .thenReturn(sampleResponse);
  ```
- Line 118–119:
  ```java
  .andExpect(status().isBadRequest())
  .andExpect(jsonPath("$.status").value(400))
  .andExpect(jsonPath("$.validationErrors.newStatus").value("حالة الطلب الجديدة مطلوبة"));
  ```
- **Direct Observations on Tests**:
  1. The test class is currently a Mockito standalone test (`@ExtendWith(MockitoExtension.class)`).
  2. Standalone MockMvc does NOT execute Spring Security filters, so anonymous (401) and forbidden (403) cannot be tested in standalone setup without Spring Security integration.
  3. Line 89 mocks the 3-argument `orderService.updateOrderStatus(...)`. If `AdminOrderController` switches to calling the overloaded 4-argument method, line 89 must be updated to match the overloaded signature.

---

## 2. Logic Chain

### 2.1. Admin Authentication Extraction Without Breaking Client Contracts
- **Observation**: HTTP clients make a `PUT /api/admin/orders/{orderNumber}/status` request with a JSON body (`UpdateOrderStatusRequest`) and an `Authorization: Bearer <jwt>` header.
- **Inference**: Adding `Authentication authentication` to the controller method signature does NOT alter the REST contract. Spring MVC resolves `Authentication` via `AuthenticationPrincipalArgumentResolver` / `PrincipalMethodArgumentResolver` entirely on the server side without expecting any URL query parameter or request body modification.
- **Safety Requirement**: In standalone tests (like the existing `AdminOrderControllerTest`), `Authentication` may resolve to `null`. Therefore, the actor extraction helper must safely inspect both the passed `authentication` parameter and `SecurityContextHolder.getContext().getAuthentication()`, and provide a graceful fallback (`"anonymous"` or `"system"` or `null`) when neither is authenticated.
- **Type Safety**:
  - In real execution: `principal` is `CustomUserDetails` (or `UserDetails`), where `getUsername()` is the admin's email.
  - In `@WithMockUser` test execution: `principal` is Spring's `org.springframework.security.core.userdetails.User`.
  - In tokenless/mock tests: `auth` is null or `AnonymousAuthenticationToken`.
  - Therefore, extracting `auth.getName()` or inspecting `instanceof UserDetails` guarantees 100% compatibility across production and test harnesses without `ClassCastException`.

### 2.2. Actor Representation: UUID vs String Mapping
- **Observation**:
  - `AdminOrderController` audit logging requirement (R4):
    `log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}", actorId, orderNumber, request.getNewStatus(), request.getReason());`
  - `OrderStatusHistory` entity requirement (R1 & R2):
    `OrderStatusHistory.actorId` is of type `UUID`.
  - `User.id` in `User.java` is `Long`.
- **Inference**:
  - For logging, human-readable identifier (admin email `admin@varellion.com` or admin username) is ideal and directly printable in `Admin [{}]`.
  - For database persistence in `OrderStatusHistory.actorId` (`UUID`), a deterministic mapping is required:
    - *Approach 1 (Recommended)*: Use RFC 4122 Type-3 name-based UUID:
      `UUID.nameUUIDFromBytes(actorIdentifier.getBytes(StandardCharsets.UTF_8))`
      This generates a deterministic, stable, valid UUID from any admin identifier (email, username, or stringified ID), preserving database integrity without modifying schemas or migrations.
    - *Approach 2*: If `actorIdentifier` can be parsed as a UUID (e.g. from Supabase JWT `sub` if applicable), use `UUID.fromString(actorIdentifier)`; otherwise fall back to `UUID.nameUUIDFromBytes(...)`.
    - *Approach 3*: Construct a UUID from the `Long` ID: `new UUID(0L, customUserDetails.getId())`.
  - Recommendation for `OrderService`:
    Overload `OrderService.updateOrderStatus` to accept `UUID actorId` (or `String actorIdentifier` that is internally converted to `UUID`), while keeping the existing 3-parameter `updateOrderStatus(orderNumber, newStatus, reason)` delegating with `null` actorId for backward compatibility.

### 2.3. PathVariable Validation & ConstraintViolationException Handling
- **Observation**:
  - Requirement R4: `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")` on `@PathVariable String orderNumber`.
  - Class requires `@Validated` from `org.springframework.validation.annotation.Validated`.
- **Inference**:
  - Placing `@Validated` on `AdminOrderController` enables Spring's `MethodValidationPostProcessor` AOP proxy to validate method arguments against JSR-380 / Jakarta validation annotations.
  - When a request supplies an invalid order number (e.g. `INVALID-ORDER-123`), Hibernate Validator rejects the parameter and throws `jakarta.validation.ConstraintViolationException`.
  - In Spring Boot 3.3.4 (Spring 6.1+), Spring MVC may also throw `HandlerMethodValidationException` if method validation is triggered during handler argument resolution.
  - Currently, `GlobalExceptionHandler` does not catch `ConstraintViolationException`, causing an unhandled 500 error.
  - Adding an explicit `@ExceptionHandler(ConstraintViolationException.class)` in `GlobalExceptionHandler` that parses `violation.getPropertyPath()` and `violation.getMessage()` and returns HTTP 400 Bad Request with an `ErrorResponse` envelope ensures full compliance with the existing REST API standard.

### 2.4. Invalid State Transition Mapping
- **Observation**:
  - Requirement R3: When `!currentStatus.canTransitionTo(newStatus)`, throw the project's existing 400 Bad Request exception.
  - `BusinessException` is the project's domain-specific exception, defaulting to `HttpStatus.BAD_REQUEST`.
  - `GlobalExceptionHandler` lines 25–36 already intercepts `BusinessException` and maps it to `ErrorResponse` with HTTP 400 Bad Request.
- **Inference**:
  - Throwing `new BusinessException("لا يمكن تغيير حالة الطلب من " + currentStatus + " إلى " + newStatus)` requires ZERO modifications to `GlobalExceptionHandler` for state transitions. The existing handler already satisfies R3.

---

## 3. Caveats

1. **Spring Boot 3.3.4 Method Validation Exception Dualism**:
   - In Spring Boot 3.3.4, method parameter validation on `@PathVariable` can produce either `jakarta.validation.ConstraintViolationException` (via AOP proxy) or `org.springframework.web.method.annotation.HandlerMethodValidationException` (via Spring MVC handler adapter).
   - *Mitigation*: In `GlobalExceptionHandler.java`, both `ConstraintViolationException` and `HandlerMethodValidationException` should be handled (or unified in the handler) to guarantee 400 Bad Request regardless of the invocation pathway.
2. **Standalone MockMvc vs Security Context**:
   - Existing unit tests in `AdminOrderControllerTest` use `MockMvcBuilders.standaloneSetup`. Standalone setup does not apply Spring Security filter chains (`SecurityFilterChain`) or `@PreAuthorize` method security.
   - *Mitigation*: To test 401 Unauthorized for anonymous and 403 Forbidden for non-admin roles as required by R5, either:
     - Upgrade `AdminOrderControllerTest` to use `@WebMvcTest(AdminOrderController.class)` with `@Import(SecurityConfig.class)` and `@MockBean`s, OR
     - Configure standalone MockMvc with a security filter chain mock or mock advice.
     - `@WebMvcTest` is the standard Spring Boot approach for testing security slices and method parameter validation.
3. **Database Schema & Entity Immutability (Guardrail R1)**:
   - `OrderStatusHistory.actorId` is `UUID`, but `User.id` is `Long`. Because schemas, migrations, and JPA entities cannot be modified under R1, the conversion to UUID must be handled purely in Java application code (e.g. `UUID.nameUUIDFromBytes(...)`).

---

## 4. Conclusion & Recommended Implementation Plan

### 4.1. Recommendations for `AdminOrderController.java`
- Add imports:
  ```java
  import jakarta.validation.constraints.Pattern;
  import lombok.extern.slf4j.Slf4j;
  import org.springframework.security.core.Authentication;
  import org.springframework.security.core.context.SecurityContextHolder;
  import org.springframework.security.core.userdetails.UserDetails;
  import org.springframework.validation.annotation.Validated;
  import java.nio.charset.StandardCharsets;
  import java.util.UUID;
  ```
- Class annotations:
  ```java
  @RestController
  @RequestMapping("/api/admin/orders")
  @RequiredArgsConstructor
  @PreAuthorize("hasRole('ADMIN')")
  @Validated
  @Slf4j
  public class AdminOrderController {
  ```
- Method implementation:
  ```java
  @PutMapping("/{orderNumber}/status")
  public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
          @PathVariable
          @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
          String orderNumber,
          @Valid @RequestBody UpdateOrderStatusRequest request,
          Authentication authentication
  ) {
      String actorId = extractActorIdentifier(authentication);
      log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}",
              actorId, orderNumber, request.getNewStatus(), request.getReason());

      UUID actorUuid = resolveActorUuid(actorId);

      OrderResponseDto updated = orderService.updateOrderStatus(
              orderNumber,
              request.getNewStatus(),
              request.getReason(),
              actorUuid
      );
      return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة الطلب بنجاح", updated));
  }

  private String extractActorIdentifier(Authentication authentication) {
      Authentication auth = authentication != null
              ? authentication
              : SecurityContextHolder.getContext().getAuthentication();

      if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
          return "system";
      }
      Object principal = auth.getPrincipal();
      if (principal instanceof UserDetails userDetails) {
          return userDetails.getUsername();
      } else if (principal instanceof String principalString) {
          return principalString;
      }
      return auth.getName() != null ? auth.getName() : "system";
  }

  private UUID resolveActorUuid(String actorIdentifier) {
      if (actorIdentifier == null || actorIdentifier.isBlank() || "system".equalsIgnoreCase(actorIdentifier)) {
          return null;
      }
      try {
          return UUID.fromString(actorIdentifier);
      } catch (IllegalArgumentException ex) {
          return UUID.nameUUIDFromBytes(actorIdentifier.getBytes(StandardCharsets.UTF_8));
      }
  }
  ```

### 4.2. Recommendations for `GlobalExceptionHandler.java`
- Add imports:
  ```java
  import jakarta.validation.ConstraintViolation;
  import jakarta.validation.ConstraintViolationException;
  import jakarta.validation.Path;
  import org.springframework.web.method.annotation.HandlerMethodValidationException;
  ```
- Add exception handlers:
  ```java
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
      log.warn("Constraint violation on path {}: {}", request.getRequestURI(), ex.getMessage());
      Map<String, String> errors = new HashMap<>();
      String primaryMessage = "صيغة البيانات المدخلة غير صحيحة";

      for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
          String fieldName = null;
          for (Path.Node node : violation.getPropertyPath()) {
              fieldName = node.getName();
          }
          if (fieldName == null) {
              fieldName = violation.getPropertyPath().toString();
          }
          errors.put(fieldName, violation.getMessage());
          primaryMessage = violation.getMessage();
      }

      ErrorResponse error = ErrorResponse.builder()
              .timestamp(LocalDateTime.now())
              .status(HttpStatus.BAD_REQUEST.value())
              .error("Validation Failed")
              .message(errors.size() == 1 ? primaryMessage : "One or more fields failed validation")
              .path(request.getRequestURI())
              .validationErrors(errors)
              .build();
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ErrorResponse> handleHandlerMethodValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
      log.warn("Handler method validation failed on path {}: {}", request.getRequestURI(), ex.getMessage());
      Map<String, String> errors = new HashMap<>();
      ex.getAllValidationResults().forEach(result -> {
          String paramName = result.getMethodParameter().getParameterName();
          result.getResolvableErrors().forEach(error -> {
              errors.put(paramName != null ? paramName : "orderNumber", error.getDefaultMessage());
          });
      });

      ErrorResponse error = ErrorResponse.builder()
              .timestamp(LocalDateTime.now())
              .status(HttpStatus.BAD_REQUEST.value())
              .error("Validation Failed")
              .message("One or more fields failed validation")
              .path(request.getRequestURI())
              .validationErrors(errors)
              .build();
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }
  ```

### 4.3. Recommendations for `OrderService.java`
- Maintain backward-compatible method overloading:
  ```java
  @Transactional
  public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason) {
      return updateOrderStatus(orderNumber, newStatus, reason, (UUID) null);
  }

  @Transactional
  public OrderResponseDto updateOrderStatus(String orderNumber, OrderStatus newStatus, String reason, UUID actorId) {
      Order order = orderRepository.findByOrderNumberWithDetails(orderNumber.trim().toUpperCase())
              .orElseThrow(() -> new ResourceNotFoundException("لم نتمكن من العثور على الطلب رقم " + orderNumber));

      OrderStatus currentStatus = order.getOrderStatus();

      // Idempotency check:
      if (currentStatus == newStatus) {
          log.info("[OrderService] Idempotent status update for order {}: status already {}", orderNumber, newStatus);
          return mapToDto(order);
      }

      // Transition check:
      if (currentStatus != null && !currentStatus.canTransitionTo(newStatus)) {
          throw new BusinessException("لا يمكن تغيير حالة الطلب من " + currentStatus + " إلى " + newStatus);
      }

      order.setOrderStatus(newStatus);

      OrderStatusHistory history = OrderStatusHistory.builder()
              .order(order)
              .previousStatus(currentStatus != null ? currentStatus.name() : null)
              .newStatus(newStatus.name())
              .reason(reason != null ? reason : "Status changed to " + newStatus.name())
              .actorId(actorId)
              .createdAt(OffsetDateTime.now())
              .build();

      if (order.getStatusHistory() == null) {
          order.setStatusHistory(new ArrayList<>());
      }
      order.getStatusHistory().add(history);
      Order savedOrder = orderRepository.save(order);
      return mapToDto(savedOrder);
  }
  ```

### 4.4. Recommendations for `AdminOrderControllerTest.java`
- Update existing Mockito mocks:
  Replace 3-arg `when(orderService.updateOrderStatus(..., ..., ...))` with 4-arg `when(orderService.updateOrderStatus(..., ..., ..., any()))` (or overloaded matches).
- Add tests covering R5:
  1. `400 Bad Request` when orderNumber pattern is invalid (e.g. `put("/api/admin/orders/INVALID-123/status")`).
  2. Audit log emission verification (via Logback `ListAppender`).
  3. Spring Security enforcement:
     - Anonymous request -> `401 Unauthorized`.
     - Request with `ROLE_USER` -> `403 Forbidden`.
     - Request with `ROLE_ADMIN` -> `200 OK`.

---

## 5. Verification Method

### 5.1. Automated Build and Test Execution
Run the project's official Maven test suite from `/home/mohamed-saad/Desktop/BRAND/backend`:
```bash
cd /home/mohamed-saad/Desktop/BRAND/backend && \
SPRING_DATASOURCE_PASSWORD=test \
JWT_SECRET=dGVzdC1zZWNyZXQta2V5LW11c3QtYmUtYXQtbGVhc3QtMjU2LWJpdHMtbG9uZw== \
mvn test
```

### 5.2. Files to Inspect
1. `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/admin/order/controller/AdminOrderController.java`
   - Verify `@Validated` and `@Slf4j` present on class.
   - Verify `@Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")` present on `@PathVariable String orderNumber`.
   - Verify exact audit log statement present.
2. `/home/mohamed-saad/Desktop/BRAND/backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java`
   - Verify `@ExceptionHandler(ConstraintViolationException.class)` returns 400 Bad Request with `ErrorResponse`.
3. `/home/mohamed-saad/Desktop/BRAND/backend/src/test/java/com/varellion/store/admin/order/controller/AdminOrderControllerTest.java`
   - Verify all existing and new tests pass.

### 5.3. Invalidation Conditions
- Any changes to database migration scripts, table schemas, or JPA entities (`Order.java`, `OrderStatusHistory.java`).
- Any modification to request/response DTO structures (`UpdateOrderStatusRequest`, `OrderResponseDto`, `ApiResponse`).
- Renaming existing enum constants in `OrderStatus.java`.
- Removing the backward-compatible 3-parameter overload in `OrderService.updateOrderStatus(orderNumber, newStatus, reason)`.
- Returning HTTP 500 when `@PathVariable String orderNumber` fails `@Pattern` validation.
