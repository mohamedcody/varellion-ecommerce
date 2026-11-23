# VARELLION Backend API Reference

## Base configuration

- Base URL: `http://localhost:8080`
- API prefix: `/api`
- Request/response format: `application/json`
- Authentication: `Authorization: Bearer <accessToken>`
- Successful application responses use:

```json
{
  "timestamp": "2026-11-23T12:00:00",
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

- Validation and application errors use a centralized JSON error response.
- The refresh token is stored in an HTTP-only `refresh_token` cookie.
- Admin endpoints require `ROLE_ADMIN`.

## Endpoint summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/actuator/health` | Public | Application and datasource health |
| POST | `/api/auth/login` | Public | Login with username/email and password |
| POST | `/api/auth/register` | Public | Register a customer account |
| POST | `/api/auth/google` | Public | Login/register with a Google ID token |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Public | Clear refresh-token cookie |
| GET | `/api/categories` | Public | List active categories |
| GET | `/api/categories/{slug}` | Public | Get an active category by slug |
| GET | `/api/products` | Public | List paginated and filtered products |
| GET | `/api/products/best-sellers` | Public | List best-selling products |
| GET | `/api/products/{identifier}` | Public | Get a product by UUID or SKU |
| POST | `/api/orders/lookup` | Public | Secure guest order lookup by JSON |
| GET | `/api/orders/track` | Public | Secure guest order lookup by query parameters |
| POST | `/api/orders` | Authenticated | Create an authenticated customer order |
| GET | `/api/orders/my-orders` | Authenticated | List the customer's orders |
| GET | `/api/orders/{orderNumber}` | Authenticated | Get one of the customer's orders |
| GET | `/api/cart` | Authenticated | Get active shopping cart |
| POST | `/api/cart/items` | Authenticated | Add a product or increase quantity |
| PUT | `/api/cart/items/{cartItemId}` | Authenticated | Update cart-item quantity |
| DELETE | `/api/cart/items/{cartItemId}` | Authenticated | Remove a cart item |
| DELETE | `/api/cart` | Authenticated | Clear the shopping cart |
| POST | `/api/cart/merge` | Authenticated | Merge guest cart items into the customer cart |
| GET | `/api/customer/profile` | Authenticated | Get customer profile |
| PUT | `/api/customer/profile` | Authenticated | Update customer profile |
| PUT | `/api/customer/address` | Authenticated | Create or update primary address |
| DELETE | `/api/customer/address` | Authenticated | Delete primary address |
| GET | `/api/admin/dashboard/summary` | Admin | Executive dashboard KPIs |
| GET | `/api/admin/dashboard/order-status-stats` | Admin | Order counts by status |
| GET | `/api/admin/dashboard/sales-analytics` | Admin | Revenue and order trends |
| GET | `/api/admin/orders` | Admin | List orders |
| GET | `/api/admin/orders/statistics` | Admin | Order status statistics |
| GET | `/api/admin/orders/{orderNumber}` | Admin | Get order details |
| PUT | `/api/admin/orders/{orderNumber}/status` | Admin | Change order lifecycle status |
| PATCH | `/api/admin/orders/{orderNumber}/notes` | Admin | Update internal admin notes |
| PATCH | `/api/admin/orders/{orderNumber}/delivery-address` | Admin | Update order delivery address |
| GET | `/api/admin/customers` | Admin | List customers |
| GET | `/api/admin/customers/{customerId}` | Admin | Get customer details |
| GET | `/api/admin/customers/{customerId}/orders` | Admin | Get a customer's orders |
| PATCH | `/api/admin/customers/{customerId}/status` | Admin | Activate/deactivate customer |
| GET | `/api/admin/products` | Admin | List products |
| GET | `/api/admin/products/{productId}` | Admin | Get product details |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/{productId}` | Admin | Update product |
| PATCH | `/api/admin/products/{productId}/status` | Admin | Activate/deactivate product |
| DELETE | `/api/admin/products/{productId}` | Admin | Delete or soft-delete product |
| GET | `/api/admin/categories` | Admin | List all categories |
| GET | `/api/admin/categories/{categoryId}` | Admin | Get category details |
| POST | `/api/admin/categories` | Admin | Create category |
| PUT | `/api/admin/categories/{categoryId}` | Admin | Update category |
| PATCH | `/api/admin/categories/{categoryId}/status` | Admin | Activate/deactivate category |
| DELETE | `/api/admin/categories/{categoryId}` | Admin | Delete category |

# 1. Health

## GET `/actuator/health`

Returns application health. Details are disabled in responses.

```json
{
  "status": "UP"
}
```

# 2. Authentication

## POST `/api/auth/login`

```json
{
  "identifier": "customer@example.com",
  "password": "P@ssw0rd123"
}
```

- `identifier`: username or email.
- `password`: required.
- Sets `refresh_token` as an HTTP-only cookie.

## POST `/api/auth/register`

```json
{
  "username": "customer1",
  "email": "customer@example.com",
  "password": "P@ssw0rd123"
}
```

Validation:

- `username`: 3–50 characters.
- `email`: valid email address.
- `password`: at least 8 characters.

## POST `/api/auth/google`

```json
{
  "idToken": "google-id-token"
}
```

The backend verifies the Google ID token and provisions the customer when needed.

## POST `/api/auth/refresh`

The refresh token may be supplied in the `refresh_token` HTTP-only cookie or in the optional JSON body:

```json
{
  "refreshToken": "eyJ..."
}
```

## POST `/api/auth/logout`

No request body. Clears the refresh-token cookie.

# 3. Public catalog

## GET `/api/categories`

No parameters. Returns active categories.

## GET `/api/categories/{slug}`

Path parameters:

- `slug`: category URL slug.

## GET `/api/products`

Query parameters:

- `category`: category slug.
- `q`: search text.
- `sort`: sorting option.
- `page`: page number, default `0`.
- `limit`: page size, default `20`.

## GET `/api/products/best-sellers`

Query parameters:

- `limit`: number of products, default `4`.

## GET `/api/products/{identifier}`

- `identifier`: product UUID or SKU.

# 4. Orders

## POST `/api/orders/lookup`

Public guest lookup.

```json
{
  "orderNumber": "VAR-20261123-0001",
  "phone": "01012345678"
}
```

## GET `/api/orders/track`

Query parameters:

- `orderNumber`, for example `VAR-20261123-0001`.
- `phone`, for example `01012345678`.

## POST `/api/orders`

Authenticated customer order creation.

Optional header:

```text
Idempotency-Key: unique-client-order-key
```

Request body:

```json
{
  "customerName": "Ahmed Mohamed",
  "customerPhone": "01012345678",
  "shippingGovernorate": "Cairo",
  "shippingCityArea": "Maadi",
  "shippingDetailedAddress": "9 Example Street",
  "alternativePhone": "01098765432",
  "paymentMethod": "CASH_ON_DELIVERY",
  "customerNotes": "Call before arrival",
  "items": [
    {
      "productId": "11111111-1111-1111-1111-111111111111",
      "quantity": 2
    }
  ]
}
```

Validation:

- `customerName`, `customerPhone`, `shippingGovernorate`, `shippingCityArea`, and `shippingDetailedAddress` are required.
- `items` must contain at least one valid item.
- Product quantity must be greater than zero.

Returns `201 Created`.

## GET `/api/orders/my-orders`

Query parameters:

- `page`, default `0`.
- `limit`, default `10`.

## GET `/api/orders/{orderNumber}`

Returns an order only if it belongs to the authenticated customer.

# 5. Shopping cart

## GET `/api/cart`

Returns the current authenticated customer's cart.

## POST `/api/cart/items`

```json
{
  "productId": "11111111-1111-1111-1111-111111111111",
  "quantity": 1
}
```

- `quantity` must be at least `1`.

## PUT `/api/cart/items/{cartItemId}`

Path parameter:

- `cartItemId`: cart-item UUID.

```json
{
  "quantity": 3
}
```

## DELETE `/api/cart/items/{cartItemId}`

Removes one cart item.

## DELETE `/api/cart`

Clears all items from the current cart.

## POST `/api/cart/merge`

```json
{
  "items": [
    {
      "productId": "11111111-1111-1111-1111-111111111111",
      "quantity": 2
    }
  ]
}
```

# 6. Customer profile

## GET `/api/customer/profile`

Returns profile and saved delivery address.

## PUT `/api/customer/profile`

```json
{
  "fullName": "Ahmed Mohamed",
  "phone": "01012345678"
}
```

## PUT `/api/customer/address`

```json
{
  "addressId": null,
  "governorate": "Cairo",
  "cityArea": "Maadi",
  "detailedAddress": "9 Example Street, Building 3"
}
```

- `governorate` and `cityArea` are required.
- `detailedAddress` must contain at least 5 characters.
- This endpoint creates or updates the primary address.

## DELETE `/api/customer/address`

Deletes the primary customer address.

# 7. Admin dashboard

## GET `/api/admin/dashboard/summary`

Returns executive dashboard KPIs.

## GET `/api/admin/dashboard/order-status-stats`

Returns order counts partitioned by lifecycle status.

## GET `/api/admin/dashboard/sales-analytics`

Query parameters:

- `days`: sliding window length, default `30`.

# 8. Admin orders

## GET `/api/admin/orders`

Query parameters:

- `page`: default `0`.
- `limit`: default `10`.
- `status`: order status enum.
- `search`: order number, customer name, or phone.
- `sortBy`: default `createdAt`.
- `sortDirection`: `ASC` or `DESC`, default `DESC`.

## GET `/api/admin/orders/statistics`

Returns aggregate order counts by status.

## GET `/api/admin/orders/{orderNumber}`

- `orderNumber` must match `^VAR-\d{8}-\d{4}$`.

## PUT `/api/admin/orders/{orderNumber}/status`

```json
{
  "newStatus": "SHIPPED",
  "reason": "Handed to delivery courier"
}
```

## PATCH `/api/admin/orders/{orderNumber}/notes`

```json
{
  "adminNotes": "Customer confirmed delivery for tomorrow"
}
```

## PATCH `/api/admin/orders/{orderNumber}/delivery-address`

```json
{
  "customerPhone": "01098765432",
  "shippingGovernorate": "Giza",
  "shippingCityArea": "Dokki",
  "shippingDetailedAddress": "14 Example Street"
}
```

# 9. Admin customers

## GET `/api/admin/customers`

Query parameters:

- `page`: default `0`.
- `limit`: default `20`.
- `search`: customer name or phone.

## GET `/api/admin/customers/{customerId}`

- `customerId`: customer UUID.

## GET `/api/admin/customers/{customerId}/orders`

Query parameters:

- `page`: default `0`.
- `limit`: default `10`.

## PATCH `/api/admin/customers/{customerId}/status`

```json
{
  "isActive": false
}
```

# 10. Admin products

## GET `/api/admin/products`

Query parameters:

- `category`: category slug.
- `search`: product name or SKU.
- `isActive`: true or false.
- `page`: default `0`.
- `limit`: default `20`.
- `sortBy`: default `createdAt`.
- `sortDirection`: `ASC` or `DESC`, default `DESC`.

## GET `/api/admin/products/{productId}`

- `productId`: product UUID.

## POST `/api/admin/products`

```json
{
  "nameAr": "ساعة فاخرة",
  "nameEn": "Luxury Watch",
  "slug": "luxury-watch",
  "categoryId": "11111111-1111-1111-1111-111111111111",
  "descriptionAr": "وصف عربي",
  "descriptionEn": "English description",
  "price": 4850.00,
  "costPrice": 2200.00,
  "stockQuantity": 15,
  "reservedQuantity": 0,
  "sku": "VAR-WAT-01",
  "isActive": true,
  "images": [
    {
      "imageUrl": "https://example.com/watch.jpg",
      "isMain": true,
      "displayOrder": 1
    }
  ]
}
```

## PUT `/api/admin/products/{productId}`

Uses the same fields as product creation in an update payload. Omitting `images` may preserve existing images if supported by the service implementation.

## PATCH `/api/admin/products/{productId}/status`

```json
{
  "isActive": false
}
```

## DELETE `/api/admin/products/{productId}`

Deletes a product or soft-deletes it when referenced by existing orders.

# 11. Admin categories

## GET `/api/admin/categories`

Lists every category and associated product counts.

## GET `/api/admin/categories/{categoryId}`

- `categoryId`: category UUID.

## POST `/api/admin/categories`

```json
{
  "nameAr": "الساعات",
  "nameEn": "Watches",
  "slug": "watches",
  "descriptionAr": "ساعة فاخرة",
  "descriptionEn": "Luxury watches",
  "displayOrder": 1,
  "isActive": true
}
```

## PUT `/api/admin/categories/{categoryId}`

```json
{
  "nameAr": "الساعات الفاخرة",
  "nameEn": "Luxury Watches",
  "slug": "luxury-watches",
  "descriptionAr": "وصف القسم",
  "descriptionEn": "Category description",
  "displayOrder": 1,
  "isActive": true
}
```

## PATCH `/api/admin/categories/{categoryId}/status`

```json
{
  "isActive": false
}
```

## DELETE `/api/admin/categories/{categoryId}`

Deletes a category only when no products are associated with it.

# 12. Common error statuses

| Status | Meaning |
|---|---|
| `400` | Validation or business-rule failure |
| `401` | Missing or invalid bearer token |
| `403` | Authenticated but missing required role |
| `404` | Resource not found |
| `409` | Conflict or optimistic-lock/IDempotency conflict |
| `429` | Rate limit exceeded |
| `500` | Unexpected server failure |
