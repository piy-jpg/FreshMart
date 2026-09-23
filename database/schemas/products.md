# Product Schema

Collection: `products`

## Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | String / UUID | Yes | Unique identifier | `"prod_leafy_01"` |
| `name` | String | Yes | Product name | `"Organic Fresh Spinach (Palak)"` |
| `category` | String | Yes | Category slug (`leafy`, `daily`, `root`, etc.) | `"leafy"` |
| `price` | Number | Yes | Selling price in INR (₹) | `40` |
| `originalPrice` | Number | No | Pre-discount MRP in INR (₹) | `50` |
| `unit` | String | Yes | Unit descriptor | `"500g bunch"` |
| `stock` | Number | Yes | Available quantity in inventory | `120` |
| `organic` | Boolean | Yes | Organic certified badge | `true` |
| `image` | String | Yes | Image URL or path | `"https://images.unsplash.com/photo-..."` |
| `rating` | Number | No | Customer satisfaction score (1-5) | `4.8` |
| `reviewsCount` | Number | No | Total review count | `142` |
