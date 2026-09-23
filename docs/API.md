# FreshMart REST API Specification

The FreshMart backend is a modular Express REST API running by default on `http://localhost:5001/api`.

## Base URL & Headers

- Base URL: `http://localhost:5001/api`
- Content-Type: `application/json`
- Authorization: `Bearer <jwt-token-or-session>`

---

## Authentication Endpoints

### `POST /api/auth/register`
Register a new customer account.
- **Request Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "phone": "9876543210",
    "password": "Password123"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": { "token": "...", "user": { "id": "...", "name": "...", "email": "...", "role": "customer" } }
  }
  ```

### `POST /api/auth/login`
Authenticate existing user or admin.
- **Request Body**:
  ```json
  {
    "identifier": "aarav@example.com",
    "password": "Password123"
  }
  ```

---

## Products Catalog Endpoints

### `GET /api/products`
Fetch available produce with optional category filtering and search.
- **Query Params**:
  - `category`: Filter by category slug (e.g. `leafy`, `daily`)
  - `search`: Text search in product name
  - `organic`: Boolean flag (`true` / `false`)

### `POST /api/products` (Admin/Owner only)
Create new fresh produce item.

### `PUT /api/products/:id` (Admin/Owner only)
Update product details, pricing, and stock.

### `DELETE /api/products/:id` (Admin/Owner only)
Remove product from inventory.

---

## Orders Endpoints

### `GET /api/orders`
Retrieve user orders (for customer) or all live orders (for admin/owner).
- **Query Params**: `status` (`Placed`, `Confirmed`, `Packing`, `Out for Delivery`, `Delivered`, `Cancelled`).

### `POST /api/orders`
Place a new order from cart.
- **Request Body**:
  ```json
  {
    "items": [
      { "id": "p1", "name": "Fresh Spinach", "price": 35, "quantity": 2 }
    ],
    "deliveryAddress": {
      "addressLine1": "Flat 201, Lotus Apts",
      "city": "Jaipur",
      "pincode": "302015"
    },
    "paymentMethod": "cod"
  }
  ```

### `PATCH /api/orders/:id/status` (Admin/Owner only)
Update the lifecycle status of an order.
- **Request Body**:
  ```json
  {
    "status": "Packing"
  }
  ```

---

## Delivery & Geofence Endpoints

### `GET /api/delivery/zones`
List active fulfillment hubs and service radius boundaries.

### `POST /api/delivery/check-service`
Verify if a given pincode or latitude/longitude is within operational coverage.
- **Request Body**:
  ```json
  { "pincode": "302015" }
  ```
