# Delivery Zones Schema

Collection: `deliveryZones`

## Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | String | Yes | Unique zone identifier | `"zone_jaipur_hub"` |
| `name` | String | Yes | Zone title | `"Jaipur Central Hub"` |
| `hubLocation` | Object | Yes | Geo coordinates of fulfillment hub | `{ "lat": 26.9124, "lng": 75.7873 }` |
| `radiusKm` | Number | Yes | Max operational delivery radius | `15` |
| `pincodes` | Array<String> | Yes | Serviced postal codes | `["302001", "302002", "302015", "302020"]` |
| `deliveryFee` | Number | Yes | Base delivery charge (₹) | `25` |
| `freeDeliveryThreshold` | Number | Yes | Minimum cart value for free delivery | `299` |
| `minOrderValue` | Number | Yes | Minimum order value to place order | `99` |
| `isActive` | Boolean | Yes | Zone status | `true` |
