# RCS Fabrics - Premium Luxury Ecommerce Platform

A complete, production-ready ecommerce platform for selling premium fabrics by the meter.

## 🏗️ Project Structure

```
rcsfabrics/
├── frontend/              # Next.js frontend application
│   ├── app/              # App router pages
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   ├── types/            # TypeScript types
│   ├── styles/           # Global styles
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route controllers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Helper functions
│   │   ├── config/       # Configuration
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Entry point
│   ├── prisma/           # Database schema & seeds
│   └── package.json
├── database/             # Database migrations
├── docs/                 # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Update DATABASE_URL and other variables

# Setup database
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📋 Features

### Customer Features
- ✅ Beautiful homepage with hero banner
- ✅ Product catalog with advanced filtering
- ✅ Product detail pages with specifications
- ✅ Shopping cart with real-time updates
- ✅ Wishlist functionality
- ✅ User authentication (Login/Register)
- ✅ Order management
- ✅ Address management
- ✅ Search functionality
- ✅ Product ratings and reviews
- ✅ Responsive design (Mobile first)
- ✅ Dark mode support

### Admin Features
- ✅ Admin dashboard
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ Customer management
- ✅ Sales analytics
- ✅ Inventory tracking
- ✅ Category management

### Technical Features
- ✅ TypeScript for type safety
- ✅ Modern UI with Tailwind CSS
- ✅ Smooth animations with Framer Motion
- ✅ State management with Zustand
- ✅ API requests with Axios & TanStack Query
- ✅ Form handling with React Hook Form
- ✅ Toast notifications
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ PostgreSQL with Prisma ORM

## 🔐 Authentication

The platform uses JWT (JSON Web Tokens) for authentication:

```typescript
// Login
POST /api/auth/login
{ email: "user@example.com", password: "password" }

// Register
POST /api/auth/register
{ email: "user@example.com", password: "password", firstName: "John", lastName: "Doe" }

// Get current user
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

## 📦 API Endpoints

### Products
```
GET    /api/products              # List all products
GET    /api/products/:id          # Get product by ID
GET    /api/products/slug/:slug   # Get product by slug
GET    /api/products/featured     # Get featured products
```

### Cart
```
GET    /api/cart                  # Get cart items
POST   /api/cart                  # Add to cart
PUT    /api/cart/:id              # Update cart item
DELETE /api/cart/:id              # Remove from cart
DELETE /api/cart                  # Clear cart
```

### Wishlist
```
GET    /api/wishlist              # Get wishlist
POST   /api/wishlist              # Add to wishlist
DELETE /api/wishlist/:id          # Remove from wishlist
```

### Orders
```
POST   /api/orders                # Create order
GET    /api/orders                # Get user orders
GET    /api/orders/:id            # Get order details
```

### Users
```
GET    /api/users/profile         # Get user profile
PUT    /api/users/profile         # Update profile
POST   /api/users/change-password # Change password
GET    /api/users/addresses       # Get addresses
POST   /api/users/addresses       # Add address
PUT    /api/users/addresses/:id   # Update address
DELETE /api/users/addresses/:id   # Delete address
```

### Admin
```
GET    /api/admin/products        # List products
POST   /api/admin/products        # Create product
PUT    /api/admin/products/:id    # Update product
DELETE /api/admin/products/:id    # Delete product
GET    /api/admin/orders          # List orders
PUT    /api/admin/orders/:id      # Update order
GET    /api/admin/dashboard/stats # Get statistics
```

## 🗄️ Database Schema

Key models:
- `User` - Customer accounts
- `Product` - Fabric products
- `Category` - Product categories
- `CartItem` - Shopping cart
- `Wishlist` - User wishlist
- `Order` - Customer orders
- `OrderItem` - Items in orders
- `Review` - Product reviews
- `Address` - Shipping addresses
- `Coupon` - Discount coupons

## 🎨 Design System

### Colors
- Primary: `#d4af37` (Gold)
- Secondary: `#bf9d7f` (Rose)
- Dark Background: `#1a1a1a`

### Typography
- Display: Playfair Display
- Body: System Sans-serif

### Components
Reusable components are organized in `/components`:
- `common/` - Layout components (Header, Footer, etc.)
- `products/` - Product-related components
- `cart/` - Cart-related components
- `auth/` - Authentication components

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy --prod
```

### Backend (Railway/Render)
```bash
# Build
npm run build

# Set environment variables in dashboard
# Deploy using git push
```

### Database (PostgreSQL Hosting)
- Use managed PostgreSQL (AWS RDS, Railway, Render, etc.)
- Update DATABASE_URL in backend .env

## 📝 Sample Data

Run seed script to populate sample products:
```bash
cd backend
npx prisma db seed
```

Creates:
- Admin account (admin@rcsfabrics.com / admin123)
- 3 Categories (Silks, Cottons, Blends)
- 4 Sample products with images

## 🔧 Development Commands

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript check
```

### Backend
```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm prisma:seed   # Seed database with sample data
npm db:studio     # Open Prisma Studio
```

## 🐛 Troubleshooting

### Database connection issues
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npx prisma db push` to sync schema

### Frontend API errors
- Check NEXT_PUBLIC_API_URL
- Ensure backend is running on correct port
- Check CORS configuration in backend

### Authentication issues
- Verify JWT_SECRET is set
- Check token expiration (JWT_EXPIRE)
- Clear localStorage and re-login

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please follow the code style and create pull requests.

## 📧 Support

For issues and questions, please open a GitHub issue or contact support@rcsfabrics.com

---

Made with ❤️ by RCS Fabrics Team
