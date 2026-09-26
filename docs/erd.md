# Dhaka Tesla Pool: Entity Relationship Diagram

This document outlines the core relational data model for the Dhaka Tesla Pool. The database is designed to enforce strict ownership, ensure reliable audit trails, and safely manage pooling capacity constraints.

## ERD Diagram

```mermaid
erDiagram
    USER ||--o| DRIVER : "can be (1:1)"
    USER ||--o{ RIDE : "requests (as Passenger)"
    USER ||--o{ RIDE_HISTORY : "triggers (Actor)"
    
    DRIVER ||--o| TESLA : "drives (1:1)"
    DRIVER ||--o{ RIDE : "accepts"

    TESLA ||--o{ POOL : "hosts"
    TESLA ||--o{ RIDE : "fulfills"

    ZONE ||--o{ RIDE : "is pickup"
    ZONE ||--o{ RIDE : "is destination"

    POOL ||--o{ POOL_MEMBERSHIP : "contains"
    POOL ||--o{ RIDE : "groups"

    RIDE ||--o| POOL_MEMBERSHIP : "has (1:1)"
    RIDE ||--o{ RIDE_HISTORY : "recorded in"

    USER {
        uuid id PK
        string name
        string email UK
        string role "PASSENGER, DRIVER"
    }

    DRIVER {
        uuid id PK
        uuid userId FK
        boolean isOnline
    }

    TESLA {
        uuid id PK
        string name
        int capacity
        uuid driverId FK
    }

    ZONE {
        uuid id PK
        string name UK
        decimal latitude
        decimal longitude
    }

    POOL {
        uuid id PK
        uuid teslaId FK
        string status
    }

    POOL_MEMBERSHIP {
        uuid id PK
        uuid poolId FK
        uuid rideId FK
        int seats
    }

    RIDE {
        uuid id PK
        uuid passengerId FK
        uuid driverId FK "nullable"
        uuid teslaId FK "nullable"
        uuid poolId FK "nullable"
        uuid pickupZoneId FK
        uuid destinationZoneId FK
        int seatsRequested
        int farePoysha
        int poolDiscountPoysha
        string paymentMethod
        string status "REQUESTED, MATCHED, STARTED, etc."
    }

    RIDE_HISTORY {
        uuid id PK
        uuid rideId FK
        uuid actorId FK "nullable"
        string fromStatus "nullable"
        string toStatus
        string note "nullable"
        datetime createdAt
    }
```
## Key Relational Rules

- **Polymorphic Users**: The `User` table holds identity. A user becomes a driver by having a linked `Driver` record.
- **Pooling**: A `Pool` belongs to a specific `Tesla`. When a `Ride` is accepted, it is assigned a `poolId` and a `PoolMembership` record is generated to lock in the seat count used at that exact moment.
- **Audit Logging**: The `RideHistory` table is an append-only log. Every status change in a `Ride` must insert a row into `RideHistory`, capturing the `actorId` (the User who triggered the change) to trace actions reliably.
- **Fare Modeling**: Fares are stored defensively as integers (`farePoysha` and `poolDiscountPoysha`) to eliminate floating-point rounding errors during currency calculations.