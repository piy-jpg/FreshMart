# FreshMart Project Documentation Index

Welcome to the comprehensive technical documentation for **FreshMart**, a hyper-local quick-commerce farm-to-door fresh produce delivery platform.

## Documentation Index

1. **[Architecture & API Reference](./API.md)**
   - Complete REST API specification across Auth, Products, Cart, Orders, Delivery Zones, and Owner controls.
   - Authentication headers, request/response JSON schemas, and error codes.

2. **[Database Schema & Models](./DATABASE.md)**
   - LowDB JSON collections, entity relationships, indexing, and migration patterns.
   - Schemas for Users, Products, Categories, Orders, Addresses, and Delivery Zones.

3. **[Hyper-Local Location & Geofencing](./LOCATION-SYSTEM.md)**
   - Real-time GPS and pincode verification, Haversine formula distance calculations.
   - Multi-tier delivery fee matrix and serviceable boundary geofencing.

4. **[Deployment & DevOps](./DEPLOYMENT.md)**
   - Local development setup, environment configurations, production deployment guidelines.
   - Dockerization, PM2 process management, and CDN static asset hosting.

---

## Monorepo Layout

```
FreshMart/
├── frontend/        # React/Vite customer storefront
├── backend/         # Express/Node modular REST API
├── admin/           # React/Vite operational & owner console
├── database/        # Markdown schemas, seeds & migrations
├── docs/            # Full system documentation
├── .gitignore
├── README.md
└── package.json     # Monorepo workspaces configuration
```
