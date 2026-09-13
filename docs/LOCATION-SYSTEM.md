# FreshMart Hyper-Local Location & Geofencing System

FreshMart guarantees hyper-local 30-minute farm-to-door delivery through precise geofencing, postal code matching, and distance-based fulfillment zones.

## Architecture

```
[ Customer Device ]
        │
        ├─ 1. GPS Browser Coordinates (lat, lng)
        └─ 2. Pincode Input (e.g. 302015)
        │
        ▼
[ LocationService.checkEligibility() ]
        │
        ├── Step A: Exact Pincode Whitelist Match
        └── Step B: Haversine Geo-distance Formula (Hub <-> User)
        │
        ▼
[ Delivery Fee & ETA Engine ]
        ├── Distance < 5 km: FREE Delivery (Min order ₹199)
        ├── Distance 5 - 15 km: ₹25 Delivery (Min order ₹299)
        └── Distance > 15 km: Out of delivery area
```

## Haversine Formula

Distance calculation between fulfillment center `(\text{lat}_1, \text{lng}_1)` and customer `(\text{lat}_2, \text{lng}_2)`:

\[
d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right)} \right)
\]

Where \(R = 6371\) km (Earth's radius).

## Fallback Mechanism
If the user denies browser geolocation permissions, FreshMart prompts for a 6-digit postal PIN code and verifies against the serviced list of fulfillment clusters.
