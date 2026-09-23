# Order Schema

Collection: `orders`

## Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | String / UUID | Yes | Unique order reference | `"ORD-1726210000"` |
| `userId` | String | Yes | Reference to User ID | `"usr_101"` |
| `customerName` | String | Yes | Customer name | `"Aarav Sharma"` |
| `customerPhone` | String | Yes | Phone number | `"9876543210"` |
| `deliveryAddress` | Object | Yes | Full delivery address snapshot | See `addresses.md` |
| `items` | Array<Object> | Yes | Array of purchased items | `[{ id: "p1", name: "Tomato", qty: 2, price: 25 }]` |
| `subtotal` | Number | Yes | Items total amount | `50` |
| `deliveryFee` | Number | Yes | Delivery charge | `0` |
| `discount` | Number | No | Applied promo code discount | `10` |
| `totalAmount` | Number | Yes | Final payable amount | `40` |
| `paymentMethod` | String | Yes | `"cod"`, `"upi"`, `"card"` | `"cod"` |
| `paymentStatus` | String | Yes | `"pending"`, `"paid"`, `"failed"` | `"pending"` |
| `status` | String | Yes | `"Placed"`, `"Confirmed"`, `"Packing"`, `"Out for Delivery"`, `"Delivered"`, `"Cancelled"` | `"Placed"` |
| `timeline` | Array<Object> | Yes | History of status updates | `[{ status: "Placed", timestamp: "..." }]` |
| `createdAt` | ISO 8601 String | Yes | Order creation date | `"2026-09-13T10:15:00.000Z"` |
