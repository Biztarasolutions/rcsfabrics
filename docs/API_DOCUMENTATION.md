# Backend API Documentation

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

Server runs on `http://localhost:5000`

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Products

#### List Products
```
GET /api/products?category=silks&sort=newest&page=1&limit=10
```

Query Parameters:
- `category` - Filter by category slug
- `search` - Search in name/description
- `sort` - newest, price_asc, price_desc, rating
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

#### Get Product by ID
```
GET /api/products/:id
```

#### Get Product by Slug
```
GET /api/products/slug/:slug
```

#### Get Featured Products
```
GET /api/products/featured?limit=8
```

### Shopping Cart

#### Get Cart
```
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 2.5
}
```

#### Update Cart Item
```
PUT /api/cart/:cartItemId
Authorization: Bearer <token>

{
  "quantity": 3
}
```

#### Remove from Cart
```
DELETE /api/cart/:cartItemId
Authorization: Bearer <token>
```

#### Clear Cart
```
DELETE /api/cart
Authorization: Bearer <token>
```

### Wishlist

#### Get Wishlist
```
GET /api/wishlist
Authorization: Bearer <token>
```

#### Add to Wishlist
```
POST /api/wishlist
Authorization: Bearer <token>

{
  "productId": "product-uuid"
}
```

#### Remove from Wishlist
```
DELETE /api/wishlist/:wishlistItemId
Authorization: Bearer <token>
```

### Orders

#### Create Order
```
POST /api/orders
Authorization: Bearer <token>

{
  "items": [ ... ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "shippingCost": 100,
  "tax": 500,
  "couponCode": "WELCOME20"
}
```

#### Get User Orders
```
GET /api/orders?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Order Details
```
GET /api/orders/:orderId
Authorization: Bearer <token>
```

### User Profile

#### Get Profile
```
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/users/profile
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

#### Change Password
```
POST /api/users/change-password
Authorization: Bearer <token>

{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### User Addresses

#### Get All Addresses
```
GET /api/users/addresses
Authorization: Bearer <token>
```

#### Add Address
```
POST /api/users/addresses
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "isDefault": true
}
```

#### Update Address
```
PUT /api/users/addresses/:addressId
Authorization: Bearer <token>
```

#### Delete Address
```
DELETE /api/users/addresses/:addressId
Authorization: Bearer <token>
```

### Admin Endpoints

All admin endpoints require `role: 'ADMIN'`

#### Get Dashboard Stats
```
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
```

Returns: totalOrders, totalRevenue, totalCustomers, totalProducts

#### List Products (Admin)
```
GET /api/admin/products?search=silk&page=1&limit=20
Authorization: Bearer <token>
```

#### Create Product
```
POST /api/admin/products
Authorization: Bearer <token>

{
  "name": "Premium Silk",
  "description": "...",
  "categoryId": "category-uuid",
  "basePrice": 1000,
  "discountPrice": 800,
  "material": "Mulberry Silk",
  "gsm": 20,
  "width": 44,
  "pattern": "Plain",
  "color": "Red",
  "stretchability": "Low",
  "usage": "Sarees",
  "washCare": "Hand wash",
  "totalStock": 100,
  "minOrderQty": 0.5
}
```

#### Update Product
```
PUT /api/admin/products/:productId
Authorization: Bearer <token>
```

#### Delete Product
```
DELETE /api/admin/products/:productId
Authorization: Bearer <token>
```

#### List Orders (Admin)
```
GET /api/admin/orders?status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

Status filter: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED

#### Update Order Status
```
PUT /api/admin/orders/:orderId
Authorization: Bearer <token>

{
  "status": "PROCESSING",
  "paymentStatus": "PAID"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common status codes:
- 400 - Bad request / Validation error
- 401 - Unauthorized (missing/invalid token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not found
- 500 - Server error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP.

## Database

Uses PostgreSQL with Prisma ORM.

Run migrations:
```bash
npx prisma db push
```

Seed sample data:
```bash
npx prisma db seed
```

View database:
```bash
npx prisma studio
```
