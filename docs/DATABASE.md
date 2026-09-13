# FreshMart Database Architecture

FreshMart utilizes an embedded LowDB JSON document engine for ultra-fast zero-latency local development and stateful testability, which directly maps to MongoDB/PostgreSQL schemas in production.

## Collections

1. **`users`**:
   - Accounts for customers, admins, drivers, and the platform owner.
   - Passwords securely stored using salted SHA-256 / bcrypt hashes.

2. **`products`**:
   - Inventory items categorized into Leafy Greens, Daily Essentials, Root Vegetables, Exotic & Organic, Farm Fruits.
   - Contains inventory counts, pricing, units, organic badges, and image references.

3. **`orders`**:
   - Customer checkout dispatches including itemized order lines, real-time status, timeline milestones, and delivery addresses.

4. **`addresses`**:
   - Customer delivery addresses with street lines, cities, pin codes, and geocoordinates.

5. **`deliveryZones`**:
   - Fulfillment hub locations, radius in kilometers, supported pin codes, base delivery charges, and minimum order values.

6. **`settings`**:
   - Platform brand configuration (`FreshMart`), helpline (`1800-FRESH-MART`), support email (`care@freshmart.in`), and store availability toggles.

## Migrations & Seeding

- Run initial schema migration:
  ```bash
  node database/migrations/001_initial_schema.js
  ```
- Seed sample products and admin accounts:
  ```bash
  node -e "require('./database/seed/products'); require('./database/seed/admin');"
  ```
