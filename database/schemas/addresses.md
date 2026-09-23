# Address Schema

Collection: `addresses`

## Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | String / UUID | Yes | Unique address identifier | `"addr_01"` |
| `userId` | String | Yes | Reference to User ID | `"usr_101"` |
| `tag` | String | Yes | `"Home"`, `"Work"`, `"Other"` | `"Home"` |
| `addressLine1` | String | Yes | Flat, House no., Building name | `"Flat 402, Royal Palms"` |
| `addressLine2` | String | No | Street name, Landmark | `"Near Central Park, Tonk Road"` |
| `city` | String | Yes | City | `"Jaipur"` |
| `state` | String | Yes | State | `"Rajasthan"` |
| `pincode` | String | Yes | 6-digit Indian PIN code | `"302015"` |
| `isDefault` | Boolean | Yes | Default shipping address | `true` |
| `lat` | Number | No | Latitude coordinate | `26.9124` |
| `lng` | Number | No | Longitude coordinate | `75.7873` |
