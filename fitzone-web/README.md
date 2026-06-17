# Fit Zone Nutrition

A modern full-stack vitamins, supplements, and sports nutrition store.

## Included

- Responsive React storefront and premium Fit Zone branding
- Product catalog with search, categories, filters, and sorting
- Product detail pages, local cart, and guest checkout
- Customer registration, login, and order history
- Admin dashboard with revenue, stock, and order summaries
- Admin product, category, inventory, and order management
- Multi-image product galleries with secure admin uploads
- BlockNote product descriptions with tables and embedded images
- Storefront purchase counts based on non-cancelled order quantities
- Cash on delivery, bank transfer, and card gateway placeholder
- Express API, JWT authentication, and MySQL database

## Stack

- Frontend: React 19, Vite 8, custom responsive CSS
- Backend: Node.js, Express, Zod
- Database: MySQL
- Authentication: JWT and bcrypt

## Setup

### Database

Run `backend/database/schema.sql` in MySQL.

### Backend

```bash
cd backend
copy .env.example .env
npm install
npm run db:seed
npm run dev
```

Update `.env` with your MySQL credentials before seeding.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Admin Login

```text
Email: admin@fitzone.lk
Password: Admin@12345
```

Change the default password before production deployment.

## Production Notes

- Connect a real card payment gateway in `backend/src/routes/orders.js`.
- Replace demo contact details and product copy with approved business information.
- Add privacy, terms, delivery, and refund policy pages.
- Use supplier-approved supplement claims and label information.
