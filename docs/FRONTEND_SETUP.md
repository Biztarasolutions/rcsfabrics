# Frontend Setup Guide

## Installation

```bash
npm install
```

## Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

## Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript

## Project Structure

- `/app` - Next.js pages (App Router)
- `/components` - React components
- `/hooks` - Custom React hooks
- `/lib` - Utilities and Zustand stores
- `/types` - TypeScript type definitions
- `/styles` - Global CSS and Tailwind config
- `/public` - Static assets

## Key Dependencies

- **Next.js 14** - React framework with SSR
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Styling

The project uses Tailwind CSS for styling. Key customizations:

- Custom color palette (primary, secondary, dark)
- Luxury-themed design
- Dark mode support
- Responsive design

## Authentication

JWT tokens are stored in localStorage:

```javascript
const token = localStorage.getItem('authToken');
```

Protected pages should check authentication status and redirect to login if needed.

## API Integration

Custom hooks in `/hooks` handle API calls:

```typescript
const { data: products } = useProducts(filters);
const { mutate: addToCart } = useAddToCart();
```

Axios is configured with automatic token injection in request headers.

## Component Organization

- **Common**: Reusable layout and utility components
- **Products**: Product listing and detail components
- **Cart**: Shopping cart related components
- **Auth**: Login and registration forms

## Performance Optimization

- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Memoization of expensive components
- Lazy loading of routes

## SEO

- Meta tags in layout
- Next.js built-in SEO features
- Sitemap generation ready

## Mobile Responsiveness

All components are mobile-first and responsive:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+
