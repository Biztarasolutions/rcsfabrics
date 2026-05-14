# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Option 1: Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url>
cd rcsfabrics

# 2. Start services with Docker
docker-compose up

# 3. Wait for services to start
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432

# 4. Seed sample data
docker-compose exec backend npx prisma db seed

# Done! Visit http://localhost:3000
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Setup database (requires PostgreSQL running)
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

#### Frontend Setup (new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 🔐 Login Credentials

**Admin Account:**
- Email: `admin@rcsfabrics.com`
- Password: `admin123`

**Test Account:**
- Create one by registering on the signup page

---

## 📱 Testing the App

### Homepage
Visit `http://localhost:3000` to see the beautiful homepage

### Browse Products
- Click "Products" to see all fabrics
- Filter by category, material, price
- Click on any fabric to see details

### Add to Cart
- View a product
- Select quantity in meters (0.5m, 1m, 1.5m, etc.)
- Click "Add to Cart"
- View cart icon to see items

### Login/Register
- Click "Login" button
- Create account or login with test credentials
- Access user dashboard

### Admin Panel
- Login as admin (admin@rcsfabrics.com / admin123)
- Visit `http://localhost:3000/admin`
- View dashboard, manage products, orders

---

## 🛠️ Development Tips

### Hot Reload
- Frontend automatically reloads on file changes
- Backend requires manual restart (use `npm run dev` with hot reload)

### Database Inspection
```bash
# Open Prisma Studio to view/edit data
cd backend
npx prisma studio
```

### API Testing
```bash
# Using curl
curl http://localhost:5000/api/products

# Using Postman
- Import API_DOCUMENTATION.md endpoints
- Set Authorization header with token for protected routes
```

### Debugging
- Browser DevTools: Open in Firefox/Chrome with F12
- Server logs: Check terminal where `npm run dev` is running
- Database errors: Check Prisma Studio or terminal output

---

## 📦 File Structure

```
frontend/
├── app/              # Pages
├── components/       # React components
├── hooks/            # Custom hooks
├── lib/              # Utilities
├── types/            # TypeScript types
└── public/           # Static files

backend/
├── src/
│   ├── routes/       # API routes
│   ├── controllers/  # Business logic
│   ├── services/     # Data access
│   └── middleware/   # Express middleware
├── prisma/           # Database schema
└── index.ts          # Server entry point
```

---

## 🚀 Next Steps

1. **Customize Design**
   - Edit colors in `tailwind.config.js`
   - Modify components in `/components`

2. **Add More Products**
   - Use Admin Dashboard
   - Or add to `backend/prisma/seed.ts`

3. **Integrate Payments**
   - Add Stripe keys in `.env`
   - Implement checkout flow

4. **Deploy**
   - See DEPLOYMENT.md guide
   - Push to GitHub
   - Deploy to Vercel (frontend) + Railway (backend)

---

## ❓ Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql postgres -U postgres -c "SELECT 1"

# Reset database
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on port 5000
- Check CORS settings in backend

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next dist node_modules
npm install
npm run build
```

---

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

---

**Need help?** Check the docs folder for detailed guides!
