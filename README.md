# FreshMart | Hyper-Local Fresh Produce Delivery Platform 🥬

FreshMart is an end-to-end quick-commerce web platform engineered for ultra-fresh farm vegetable and fruit delivery directly to customers.

## Monorepo Architecture

```
FreshMart/
├── frontend/                         # Customer website (React / Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # REST API (Node / Express)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── validators/
│   └── package.json
│
├── admin/                            # Admin & Owner Console (React / Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── database/                         # Database models, schemas, seeds & migrations
│   ├── schemas/
│   ├── seed/
│   └── migrations/
│
├── docs/                             # Engineering documentation
│   ├── API.md
│   ├── DATABASE.md
│   ├── LOCATION-SYSTEM.md
│   ├── DEPLOYMENT.md
│   └── README.md
│
├── .gitignore
├── README.md
└── package.json                      # Workspaces configuration
```

## Quick Start

```bash
# Install all dependencies across all packages
npm install

# Start Backend API (Port 5001)
npm run dev:backend

# Start Customer Storefront (Port 5173)
npm run dev:frontend

# Start Admin Operations Portal (Port 5174)
npm run dev:admin
```

## Testing

```bash
# Run owner system verification
node test_owner_system_inprocess.js

# Run order lifecycle verification
node test_order_lifecycle_inprocess.js

# Run authentication test suite
node test_auth_system_inprocess.js
```

## Customer Support & Branding
- **Helpline**: `1800-FRESH-MART`
- **Support Email**: `care@freshmart.in`
