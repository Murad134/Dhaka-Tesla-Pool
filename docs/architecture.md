# Dhaka Tesla Pool: System Architecture

The Dhaka Tesla Pool MVP is designed with a modern decoupled stack, prioritizing simplicity, clear boundaries, and concurrency safety for ride pooling.

## System Diagram

```mermaid
flowchart TD
    %% Nodes
    Client[Browser / Mobile Web]
    Next[Next.js Frontend\n(React App Router)]
    Express[Express.js Backend\n(REST API)]
    Postgres[(PostgreSQL\nDatabase)]
    Prisma[Prisma ORM]

    %% Flow
    Client -->|HTTP Requests| Next
    Next -->|API Calls (JWT Auth)| Express
    Express -->|Queries & Transactions| Prisma
    Prisma -->|SQL| Postgres

    %% Styling
    classDef frontend fill:#333,stroke:#00ff9d,stroke-width:2px,color:#fff;
    classDef backend fill:#111,stroke:#00ff9d,stroke-width:2px,color:#fff;
    classDef db fill:#0055ff,stroke:#fff,stroke-width:2px,color:#fff;
    
    class Next,Client frontend;
    class Express,Prisma backend;
    class Postgres db;
```

## Data Flow & Tech Choices

1. **Browser (Client)**: Users interact with a pure CSS responsive UI. State is managed locally via React Context (`AuthContext`).
2. **Next.js (Frontend)**: Serves static and client-side rendered pages. Communicates directly with the Express API via a centralized `apiFetch` wrapper that handles JWT injection.
3. **Express.js (Backend)**: Contains the core business logic, organized into standard controllers (`rideController`, `authController`, `driverController`). Defends against unauthorized state transitions.
4. **PostgreSQL + Prisma**: Stores relational data. Prisma handles migrations and type-safe queries.

## Core Ride & Pooling Flow

1. **Request**: Passenger requests a ride specifying pickup, destination, and seats required.
2. **Matching (The Race Condition)**: A Driver sees the request and hits "Accept / Pool". The API begins a **Serializable Transaction** via Prisma:
   - Locks the specific `Tesla` record to check current capacity.
   - Sums up the seats of existing non-cancelled passengers in the current `Pool`.
   - Rejects the request if adding the new passenger would exceed the Tesla's capacity (e.g., Bullet has 3 seats).
   - If valid, updates the `Ride` status to `MATCHED` and creates a `PoolMembership`.
3. **Fare Recalculation**: If pooling occurs, all passengers in the pool receive a `poolDiscountPoysha` deduction.
4. **Lifecycle**: The Driver explicitly advances the state machine (`MATCHED` → `DRIVER_ARRIVED` → `STARTED` → `COMPLETED`). Any actor can trigger `CANCELLED` before the ride starts. Every transition writes to the `RideHistory` audit table.
