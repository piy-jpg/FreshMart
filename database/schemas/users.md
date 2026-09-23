# User Schema

Collection: `users`

## Fields

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | String / UUID | Yes | Unique identifier | `"usr_101"` |
| `name` | String | Yes | Full name of the user | `"Aarav Sharma"` |
| `email` | String | Yes | Email address (unique) | `"aarav@example.com"` |
| `phone` | String | Yes | 10-digit Indian phone number | `"9876543210"` |
| `passwordHash` | String | Yes | SHA-256 / bcrypt password hash | `"e3b0c44298fc1c149afbf4c8996fb924..."` |
| `role` | String | Yes | `"owner"`, `"admin"`, `"customer"`, `"driver"` | `"customer"` |
| `createdAt` | ISO 8601 String | Yes | Account registration timestamp | `"2026-09-13T10:00:00.000Z"` |
| `lastLogin` | ISO 8601 String | No | Last authenticated session | `"2026-09-13T12:00:00.000Z"` |
