# Dhaka Tesla Pool

Dhaka Tesla Pool is a full-stack ride-pooling MVP for sharing fixed-capacity Tesla rides between compatible Dhaka zones. It supports passenger ride requests, driver matching, pool capacity protection, fare calculation, JWT authentication, and ride lifecycle tracking.

# Project Story
It's 8:41 AM in Dhaka. Jashim is driving his Tesla, Bullet, from Banani. Nusrat requests a ride from Banani → Mohakhali, and moments later Rafiq requests Banani → Gulshan 1.

Their destinations are different, but their routes are compatible, so the system can place them in the same pool while calculating an individual, discounted fare for each passenger.

Then Shirin tries to join. Bullet has a fixed capacity of three seats, so the system must guarantee that occupied seats never exceed capacity, even when multiple passengers attempt to claim the last available seat concurrently.

That makes this more than a simple ride-booking CRUD application. It handles authentication, ownership, route matching, pooling, fare calculation, capacity protection, concurrency, and an auditable ride lifecycle.

# Core Business Problems
The system is designed to solve the following problems:

- Ride ownership: Passengers can create and manage only their own rides.
- Route compatibility: Rides are matched only when their predefined routes satisfy the project's corridor-matching rules.
- Shared pooling: Multiple compatible passenger rides can share the same Tesla.
- Individual fares: Each passenger receives a separately calculated fare based on their route, with a pool discount when applicable.
- Capacity protection: Occupied seats can never exceed the Tesla's fixed capacity.
- Concurrency: Simultaneous attempts to claim the last available seat are handled safely using transactional database operations.
- Ride lifecycle: Only valid ride-status transitions are accepted.
- Auditability: Every ride-status transition is recorded in RideHistory.

## Live Deployment

- Frontend: https://frontend-dhaka-tesla-pool.vercel.app
- Backend: https://backend-dhaka-tesla-pool.vercel.app
- Health check: https://backend-dhaka-tesla-pool.vercel.app/health
- Project Demo : https://drive.google.com/file/d/1AZ2NXUzxhLtmzrjfryrKEnmADixjLudv/view

The frontend and backend are deployed as separate Vercel projects. PostgreSQL is hosted separately and is accessed by Prisma from the backend function.

## Zones & Matching Rule

The predefined zones are:

- Banani
- Gulshan 1
- Gulshan 2
- Mohakhali
- Dhanmondi
- Mirpur
- Uttara
- Farmgate
- Bashundhara

Two rides can be pooled when they have the same pickup zone and compatible destination corridors. Different pickup zones can also match only when both routes are registered compatible corridors and the destinations overlap, meet at a pickup zone, or otherwise satisfy the corridor rule in `backend/src/utils/zones.js`. This is route-corridor matching, not live map-based routing.

## Features

- Passenger registration and login
- Driver registration and login
- Driver online/offline status
- Ride requests with seat counts and payment method
- Fare calculation in poysha with pool discounts
- Route compatibility matching across predefined Dhaka zones
- Tesla and pool capacity enforcement
- Ride status transitions:
  `REQUESTED -> MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED`
- Ride cancellation and ride history
- Serializable Prisma transactions for concurrent matching
- API health endpoint with database connectivity status

## Architecture

```mermaid
flowchart LR
    User[Passenger or Driver] --> Web[Next.js Web App]
    Web -->|REST requests + JWT| API[Express REST API]

    subgraph Backend[Backend domain services]
        Routes[Routes and middleware]
        Controllers[Controllers]
        Match[Pool matcher]
        Fare[Fare calculator]
        State[Ride state machine]
    end

    API --> Routes --> Controllers
    Controllers --> Match
    Controllers --> Fare
    Controllers --> State
    Controllers --> Prisma[Prisma ORM]
    Match --> Prisma
    Fare --> Prisma
    State --> Prisma
    Prisma --> DB[(PostgreSQL)]
```

Preview-safe architecture map:

```text
Passenger / Driver
        |
        | REST requests + JWT
        v
Next.js Web App
        |
        v
Express REST API
        |
        +--> Auth / ownership middleware
        |
        +--> Controllers
                |
                +--> Pool matcher
                +--> Fare calculator
                +--> Ride state machine
                +--> Prisma ORM
                        |
                        v
                  PostgreSQL database
```

### Request and Matching Flow

1. The frontend sends an authenticated ride request or driver action to the Express API.
2. Authentication, ownership, and request checks run in middleware before the controller changes data.
3. The controller uses the fare calculator, route-corridor matcher, and ride state machine according to the operation.
4. Pool acceptance runs inside a Prisma `Serializable` transaction. It verifies route compatibility, locks the Tesla capacity decision, counts active pool seats, and then creates the pool membership and assignment together.
5. PostgreSQL remains the source of truth for ride status, pool membership, seat usage, payment state, and the ride-history audit trail.

### Ride Lifecycle

```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> MATCHED: driver accepts / pool match
    MATCHED --> DRIVER_ARRIVED: driver arrives
    DRIVER_ARRIVED --> STARTED: ride starts
    STARTED --> COMPLETED: ride ends
    REQUESTED --> CANCELLED: cancel
    MATCHED --> CANCELLED: cancel
    DRIVER_ARRIVED --> CANCELLED: cancel before start
```

Only valid transitions are accepted by the state machine. Each transition records the previous status, new status, actor, optional note, and timestamp in `RideHistory`.

## Database Design / ERD

PostgreSQL is the source of truth for identity, rides, vehicle capacity, pooling, payment state, and audit history. Prisma manages the schema, migrations, and transactional writes. The full ERD is also maintained in [docs/erd.md](docs/erd.md); the diagram below is aligned with `backend/prisma/schema.prisma`.

```mermaid
erDiagram
    USER ||--o| DRIVER : has_optional_profile
    USER ||--o{ RIDE : requests
    USER o|--o{ RIDE_HISTORY : acts_on_optionally
    DRIVER ||--o| TESLA : drives
    DRIVER o|--o{ RIDE : accepts_optionally
    TESLA o|--o{ RIDE : fulfills_optionally
    TESLA ||--o{ POOL : hosts
    ZONE ||--o{ RIDE : pickup
    ZONE ||--o{ RIDE : destination
    POOL o|--o{ RIDE : groups_optionally
    POOL ||--o{ POOL_MEMBERSHIP : contains
    RIDE ||--o| POOL_MEMBERSHIP : has_one
    RIDE ||--o{ RIDE_HISTORY : records

    USER {
      uuid id PK
      string name
      string email UK
      string passwordHash
      Role role
      datetime createdAt
      datetime updatedAt
    }
    DRIVER {
      uuid id PK
      string userId FK, UK
      boolean isOnline
      datetime createdAt
      datetime updatedAt
    }
    TESLA {
      uuid id PK
      string name
      string driverId FK, UK
      int capacity
      datetime createdAt
      datetime updatedAt
    }
    ZONE {
      uuid id PK
      string name UK
      decimal latitude
      decimal longitude
      datetime createdAt
    }
    POOL {
      uuid id PK
      string teslaId FK
      RideStatus status
      datetime createdAt
      datetime updatedAt
    }
    RIDE {
      uuid id PK
      string passengerId FK
      string driverId FK "nullable"
      string teslaId FK "nullable"
      string poolId FK "nullable"
      string pickupZoneId FK
      string destinationZoneId FK
      int seatsRequested
      decimal distanceKm
      int farePoysha
      int poolDiscountPoysha
      PaymentMethod paymentMethod
      PaymentStatus paymentStatus
      RideStatus status
      datetime requestedAt
      datetime matchedAt "nullable"
      datetime driverArrivedAt "nullable"
      datetime startedAt "nullable"
      datetime completedAt "nullable"
      datetime cancelledAt "nullable"
    }
    POOL_MEMBERSHIP {
      uuid id PK
      string poolId FK
      string rideId FK, UK
      int seats
      datetime joinedAt
    }
    RIDE_HISTORY {
      uuid id PK
      string rideId FK
      string actorId FK "nullable"
      RideStatus fromStatus "nullable"
      RideStatus toStatus
      string note "nullable"
      datetime createdAt
    }
```

Preview-safe relationship map:

```text
USER (1) ------------------ (0..1) DRIVER
  |                              |
  | requests                     | drives
  |                              v
  |                         (0..1) TESLA
  |                              |
  |                              +---- (0..many) POOL
  |
  +---- (0..many) RIDE <---------- optional DRIVER
             |
             +-------------------- optional TESLA
             +-------------------- optional POOL
             +---- (1) pickup ZONE
             +---- (1) destination ZONE
             +---- (0..1) POOL_MEMBERSHIP ---- (1) POOL
             +---- (0..many) RIDE_HISTORY ---- optional USER(actor)
```

### Fare Model
The fare for each passenger is calculated using a simple and transparent formula:

 `Passenger Fare = Base Fare + Distance Charge − Pool Discount`

Where:

- Base Fare: Fixed starting fare for every ride.
- Distance Charge: Calculated based on the estimated trip distance.
- Pool Discount: Discount applied when the passenger is part of a shared pool.

### Relational Rules and Data Integrity

- **Identity and roles:** `User` stores authentication and role data. A driver has one optional `Driver` profile, and each driver can have at most one Tesla through unique foreign keys.
- **Ride ownership:** Every ride belongs to one passenger. Driver, Tesla, and Pool assignments remain nullable until matching succeeds.
- **Route modeling:** `Ride` references `Zone` twice, once for pickup and once for destination. Route compatibility is enforced by the predefined corridor rules, not by live map routing.
- **Pooling:** A Pool belongs to one Tesla. A ride can have at most one `PoolMembership`, and its unique `rideId` prevents duplicate membership. The stored `seats` value records the capacity consumed by that ride.
- **Capacity and concurrency:** Matching checks active membership seats against Tesla capacity inside a serializable transaction, preventing concurrent accepts from overbooking a vehicle.
- **Money and payment:** `farePoysha` and `poolDiscountPoysha` are integers, avoiding floating-point currency errors. `PaymentMethod` and `PaymentStatus` model how the fare is paid and its current state.
- **Auditability:** `RideHistory` is append-only application history. `actorId` is nullable so a transition can remain auditable even if the acting user is later removed; deleting a ride cascades to its history.
- **Deletion behavior:** Passenger, driver, Tesla, and zone references protect ride records with restricted deletes. Pool removal sets a ride's `poolId` to null, while pool memberships are removed with their parent pool or ride.

## Screenshots
### Home page
<img src="https://i.ibb.co.com/HT4xDZVD/Dashboard.png" alt="Home Page" />

The main passenger dashboard for requesting rides, viewing active rides, and accessing ride history.
### Login
<img src="https://i.ibb.co.com/pBkv1nsm/Login.png" alt="Login Page" />

Secure login screen for passenger and driver authentication.
### Nusrat — Ride Request
<img src="https://i.ibb.co.com/d4TTbsh3/Nusrat-Request-Pool.png" alt="Nusrat Ride Request" />

Nusrat requests a ride from Banani to Mohakhali with an estimated fare.
### Nusrat — After Request
<img src="https://i.ibb.co.com/P2LDPmF/N-after-Request.png" alt="Nusrat After Request" />

Displays Nusrat's created ride with its current status and ride details.
### Nusrat — Ride Tracking
<img src="https://i.ibb.co.com/hJ9k1WKV/N-ride-tracking.png" alt="Nusrat Ride Tracking" />

Nusrat can track the current ride status throughout the trip lifecycle.

### Nusrat — Ride History
<img src="https://i.ibb.co.com/QF1YFVjN/N-ride-history.png" alt="Nusrat Ride History" />

Displays Nusrat's completed and previous rides in the ride history.

### Rafiq — Ride Request
<img src="https://i.ibb.co.com/hxK4TkMm/Rafiq-Request-pool.png" alt="Rafiq Ride Request" />

Rafiq requests a compatible ride from Banani to Gulshan 1.

### Rafiq — After Request
<img src="https://i.ibb.co.com/6753385F/Rafiq-after-request.png" alt="Rafiq After Request" />

Displays Rafiq's ride request with its calculated fare and current status.

### Shirin — After Request
<img src="https://i.ibb.co.com/ptKcJSC/Shirin-after-request.png" alt="Shirin After Request" />

Shirin's request demonstrates the shared-Tesla flow and fixed passenger capacity.

### Active Ride Validation
<img src="https://i.ibb.co.com/gL8tqJ04/N-request-another-when-he-Active-Ride.png" alt="Active Ride Validation" />

Prevents a passenger from creating another ride while an active ride is already in progress.

### Jashim — Driver Dashboard
<img src="https://i.ibb.co.com/PZNtnYNw/Jashim-Driver-Dashboard.png" alt="Jashim Driver Dashboard" />

Driver dashboard showing Jashim's Bullet, passenger requests, and pool information.

### Jashim — Accept Pool
<img src="https://i.ibb.co.com/h19ZxHLQ/Jasim-accept-Pool.png" alt="Jashim Accept Pool" />

Jashim accepts the compatible passenger pool for Bullet.

### Jashim — Driver Arrived
<img src="https://i.ibb.co.com/DDq9Fjdd/Jasim-after-Click-arrived.png" alt="Jashim Driver Arrived" />

The driver marks the ride as arrived and moves it to the DRIVER_ARRIVED state.

### Jashim — Start Trip
<img src="https://i.ibb.co.com/5mHgKNX/Jasim-after-click-Start-Trip.png" alt="Jashim Start Trip" />

The driver starts the pooled trip and moves the ride to the STARTED state.

### Jashim — Complete Ride
<img src="https://i.ibb.co.com/hvswSvt/Jasim-after-click-complete-ride.png" alt="Jashim Complete Ride" />

The driver completes the trip and moves the ride to the COMPLETED state

### Jashim — Dashboard After Completion
<img src="https://i.ibb.co.com/PvRVpBGm/Jasim-Dashboard-after-complete-Ride.png" alt="Jashim Dashboard After Completion" />

The driver dashboard reflects the completed ride and updated trip information.

### Applications

| Application | Directory | Local URL | Production |
| --- | --- | --- | --- |
| Frontend | `frontend/` | `http://localhost:3001` | Vercel |
| Backend | `backend/` | `http://localhost:4000` | Vercel serverless function |
| PostgreSQL | Docker service | `localhost:5432` | Hosted PostgreSQL |

### Project Structure

```text
backend/
  api/index.js             Vercel serverless entry point
  prisma/                  Schema, migrations, and seed data
  src/server.js            Express application
  src/controllers/         Request handlers
  src/middlewares/         Auth, ownership, and error handling
  src/routes/              API route registration
  src/utils/               Fare, matching, zones, and state logic
  src/tests/               Jest and Supertest tests
  vercel.json              Vercel route rewrites for Express paths

frontend/
  src/app/                 Next.js App Router pages
  src/components/          Shared UI components
  src/context/             Authentication context
  src/lib/api.js           API client and JWT header handling
  public/images/            Static image assets

docker-compose.yml         Local PostgreSQL, backend, and frontend services
```

## Technology

- Next.js 15.5.26 and React 19
- Node.js 20+
- Express 5
- PostgreSQL 16
- Prisma 6
- JWT authentication
- Docker Compose
- Vercel

## Technology Decisions

| Technology | Why it fits this MVP | Realistic alternative | When to change it |
| --- | --- | --- | --- |
| Next.js | Provides the App Router, page routing, and production builds for the passenger and driver UI. | Remix or Vite with React | Change if the frontend needs a different rendering model or a separate SPA architecture. |
| React | Supports reusable dashboards, forms, status views, and authentication UI. | Vue or Svelte | Change if the team standardizes on another component ecosystem. |
| Node.js | Keeps the frontend tooling and backend language consistent and works well for REST I/O. | Go or Java | Change for different runtime performance, operational, or team requirements. |
| Express | Keeps the REST API small and explicit while allowing existing middleware and route patterns. | Fastify or NestJS | Change when validation, modules, or throughput requirements justify a larger framework. |
| PostgreSQL | Provides relational integrity and serializable transactions for ride and seat-capacity data. | MySQL or a managed relational database | Change only if workload, geography, or operational requirements require another datastore. |
| Prisma | Gives the Node.js API a typed schema, migrations, and transaction support. | Drizzle or node-postgres | Change if query control, bundle size, or ORM capability becomes a constraint. |
| JWT | Provides stateless authentication suitable for this MVP and its separate frontend/backend deployment. | Server sessions or an identity provider | Change when token revocation, SSO, MFA, or centralized identity becomes essential. |
| Docker Compose | Reproduces PostgreSQL, backend, and frontend locally with health checks and persistent data. | Dev Containers or Kubernetes | Change when local orchestration or production service management needs a different platform. |
| Vercel | Deploys the Next.js frontend and the Express API entry point with Git-based builds. | Render, Railway, Fly.io, or a VPS | Change when long-running workers, WebSockets, or container control are required. |
| Supabase PostgreSQL | Provides a hosted PostgreSQL database suitable for Prisma and the deployed API. | Neon, Railway PostgreSQL, or managed AWS RDS | Change for different region, pooling, compliance, backup, or scaling requirements. |

These choices keep the MVP relational, easy to run locally, and simple to deploy while preserving a path toward managed infrastructure as usage grows.

## Git Workflow

The project follows a feature-based Git workflow with the following promotion path:

```text
feature/* -> master -> pre-release -> release/v1.0.0
```

The repository maintains these long-lived branches:

- `master` — main integration branch
- `pre-release` — cut from master for integration fixes, docs, and deployment checks
- `release/v1.0.0` — cut from pre-release as the tagged MVP version
- `feature/passenger-auth` — passenger registration, login, and JWT authentication
- `feature/tesla-pooling` — reserved for pooling and capacity-enforcement work

The commit history shows incremental work across database design, authentication, rides, pooling, drivers, tests, UI, Docker, environment configuration, and deployment.

## Commit History / Engineering Journey

The following list records the provided commit subjects in chronological project order:

1. `chore: initialize project structure with essential configuration files`
2. `feat: add initial database schema and migration files for user, ride, and pooling management`
3. `feat(auth): implement JWT authentication and user roles`
4. `feat(rides): implement ride requests, fare calculation, and zones`
5. `feat(pool): implement pooling matching and capacity enforcement`
6. `feat(driver): implement driver flow and ride lifecycle`
7. `test: add comprehensive tests for pool capacity, concurrency, ownership, fare, and ride state transitions`
8. `chore: remove frontend subproject`
9. `feat(ui): implement passenger driver and authentication flows`
10. `build(docker): add Docker Compose setup with migrations, seed, and health checks`
11. `chore(env): configure Supabase PostgreSQL and JWT environment variables`
12. `feat: update backend and frontend configurations for Vercel deployment`
13. `chore: update dependencies and deployment configurations`
14. `feat(ui): show success and error notifications with SweetAlert2`

The Docker work added backend and frontend Dockerfiles, `.dockerignore` files, a PostgreSQL service, a persistent PostgreSQL volume, environment configuration, Prisma migrations and seed execution, and service health checks.

The final Vercel configuration work added the backend `vercel-build` script for Prisma generation, the Vercel API entry point, `vercel.json` route rewrites, CORS updates, frontend ESLint/FlatCompat updates, the Next.js Image migration, `useCallback` refactoring, backend test import fixes, and the `.vercel` gitignore update.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop with Docker Compose
- A hosted PostgreSQL database for production
- Vercel CLI for command-line deployment

## Environment Variables

Never commit `.env`, `.env.local`, database credentials, or JWT secrets. Use the example files as templates.

### Root `.env`

Used by Docker Compose for local PostgreSQL and service configuration:

```env
POSTGRES_DB=dhaka_tesla_pool
POSTGRES_USER=postgres
POSTGRES_PASSWORD=use-a-local-password
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Docker maps the frontend to port `3001`, so both `3000` and `3001` are allowed for local CORS. The actual frontend used by Docker is `http://localhost:3001`.

### Backend `.env`

Used when running the backend directly without Docker:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool?schema=public
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1d
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

When using Docker Compose, the database host is `postgres`, not `localhost`; Compose supplies that connection automatically.

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` is embedded into the Next.js build. Set it in Vercel before deploying, not only after the deployment finishes.

## Run Locally With Docker

From the repository root:

```bash
docker compose up --build -d
```

Open:

- Frontend: http://localhost:3001
- Backend root: http://localhost:4000
- Backend health: http://localhost:4000/health

Check service status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Stop the services:

```bash
docker compose down
```

The backend container runs Prisma migrations and seed data during startup. PostgreSQL data is stored in the `postgres_data` Docker volume.

## Run Without Docker

Start PostgreSQL separately, then run the backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

In another terminal, run the frontend:

```bash
cd frontend
npm install
npm run dev
```

For a production-like frontend run:

```bash
cd frontend
npm run build
npm run start
```

## Database Operations

Create and apply a development migration:

```bash
cd backend
npx prisma migrate dev --name describe-your-change
```

Apply committed migrations to a hosted production database:

```bash
cd backend
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
cd backend
npx prisma generate
```

For hosted providers such as Supabase, use the provider's Prisma-compatible connection string. If a pooler connection is unsuitable for migrations, use the provider's direct database connection for the migration command and keep the pooler URL for runtime traffic.

## Tests and Quality Checks

Run backend tests:

```bash
cd backend
npm test
```

Run backend lint:

```bash
cd backend
npm run lint
```

Run frontend lint and build:

```bash
cd frontend
npm run lint
npm run build
```

The test suite covers fare calculation, route matching, pool capacity, ownership, state transitions, and concurrent matching behavior.

## Vercel Deployment

Deploy frontend and backend as two separate Vercel projects from the same GitHub repository.

### Frontend project

Vercel settings:

```text
Project root directory: frontend
Framework preset: Next.js
Build command: npm run build
Install command: npm install
```

Production environment variable:

```env
NEXT_PUBLIC_API_URL=https://backend-dhaka-tesla-pool.vercel.app/api
```

### Backend project

Vercel settings:

```text
Project root directory: backend
```

The backend uses `api/index.js` as the serverless entry point. `vercel.json` rewrites `/health`, `/api/*`, and other backend paths to that Express function. Do not deploy the Dockerfile or Docker Compose database to Vercel.

Production environment variables:

```env
DATABASE_URL=your-hosted-postgresql-connection-string
JWT_SECRET=your-random-secret-at-least-32-characters
JWT_EXPIRES_IN=1d
NODE_ENV=production
CORS_ORIGIN=https://frontend-dhaka-tesla-pool.vercel.app
```

Run production migrations against the hosted database before testing user flows:

```bash
cd backend
npx prisma migrate deploy
```

### Vercel CLI workflow

The root-directory setting means deployment should be launched from the repository root after the project is linked:

```bash
vercel link
vercel --prod
```

If Vercel reports `frontend/frontend` or `backend/backend`, the command was launched from the child directory while the Vercel project already has that child directory configured as its root. Run the command from the repository root instead.

### Deployment verification

Check the backend:

```text
GET https://backend-dhaka-tesla-pool.vercel.app/health
```

Expected response:

```json
{"status":"ok","database":"ok"}
```

When testing from the frontend origin, the backend preflight response must include:

```text
Access-Control-Allow-Origin: https://frontend-dhaka-tesla-pool.vercel.app
```

## API Overview

All application routes are prefixed with `/api`.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Passenger and ride routes

- `POST /api/rides`
- `GET /api/rides/:id`
- `PATCH /api/rides/:id/status`
- `GET /api/rides/history`

### Driver routes

- `GET /api/drivers/me`
- `GET /api/drivers/requests`
- `GET /api/drivers/history`
- `PATCH /api/drivers/online`

### Pool routes

- `POST /api/rides/:id/match`
- `GET /api/pools/:id`

Protected routes require:

```http
Authorization: Bearer <jwt-token>
```

## Demo Data

The seed script creates demo users and zones. Demo password:

```text
Password123!
```

Demo accounts:

- Driver: `jashim@example.com`
- Passenger: `nusrat@example.com`
- Passenger: `rafiq@example.com`
- Passenger: `shirin@example.com`

Do not use these credentials in a real production system.

## Known Limitations & Next Improvements

- **Corridor-based matching**: Matching uses predefined zone corridors rather than live distance, traffic, or map routing. A future version could use a routing provider or PostGIS.
- **No real-time tracking**: Ride status is refreshed through REST requests and does not include live vehicle location tracking. WebSockets or server-sent events could support this later.
- **Single-region deployment**: The current Vercel and hosted PostgreSQL deployment is intended for a single-region MVP. Multi-region services and read replicas may be needed for broader coverage.
- **Simulated payment only**: Payment methods and statuses are modeled in the database, but no real payment gateway is integrated. A production release would need a provider, webhook handling, and reconciliation.

## Troubleshooting

### CORS error in the browser

Confirm that:

1. `CORS_ORIGIN` exactly matches the frontend origin, including `https://` and without a trailing slash.
2. `NEXT_PUBLIC_API_URL` ends with `/api`.
3. The backend has been redeployed after changing its environment variables.
4. The backend `vercel.json` rewrite is deployed.
5. The preflight response contains `Access-Control-Allow-Origin`.

Do not enter environment values through a shell pipeline that adds line endings. A value such as `production\r\n` fails backend validation. Vercel's dashboard environment editor or a newline-free value file should be used.

### `FUNCTION_INVOCATION_FAILED`

Check the Vercel runtime logs and verify that `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, and `CORS_ORIGIN` exist in the Production environment. The Docker hostname `postgres` is valid only inside Docker Compose and cannot be used by Vercel.

### Vercel cannot find the project

Deploy each project from its configured root directory or from the repository root with the project linked. Do not configure the repository root as both the working directory and the project root.

### Database is unavailable

Check the hosted database connection string, SSL requirements, connection pool limits, and whether the database allows connections from the deployment provider. Then run `npx prisma migrate deploy` against that same database.

## Fare Model

The fare calculator uses the following formula:

```text
passengerFare = baseFare + (distanceKm * perKmRate) - poolDiscount
```

Current implementation constants:

- `baseFare = 5,000` poysha (BDT 50)
- `perKmRate = 3,000` poysha per kilometre (BDT 30/km)
- `poolDiscount = 20% of the gross fare` when the ride is pooled

Worked examples:

| Passenger | Route | Distance | Gross fare | Pool discount | Passenger fare |
| --- | --- | ---: | ---: | ---: | ---: |
| Nusrat | Banani -> Mohakhali | 4 km | `5,000 + (4 * 3,000) = 17,000` | `20% of 17,000 = 3,400` | `13,600` poysha (BDT 136) |
| Rafiq | Banani -> Gulshan 1 | 5 km | `5,000 + (5 * 3,000) = 20,000` | `20% of 20,000 = 4,000` | `16,000` poysha (BDT 160) |

Without pooling, the discount is zero, so the same fares would be `17,000` and `20,000` poysha. The implementation rounds distance charges and discounts to whole poysha and stores fare values as integers.

## Design and Domain Decisions

- Predefined zones keep the MVP independent of an external maps provider.
- PostgreSQL provides relational integrity for users, rides, pools, and history.
- Serializable transactions prevent two concurrent matches from exceeding Tesla capacity.
- JWT keeps authentication stateless for the MVP.
- The current matching algorithm is intentionally limited to compatible predefined corridors.

## Scaling Roadmap

At much higher traffic, the current serializable matching transaction may become a contention point. Possible future improvements include:

1. Redis-based seat reservations with atomic operations.
2. A queue and dedicated matching worker.
3. Read replicas for ride history and status queries.
4. PostGIS for geographic matching.
5. WebSockets or server-sent events for real-time ride status.
6. Horizontal API scaling behind an API gateway.

## Security and Contributions

Keep secrets out of Git, never use demo credentials in production, add tests for behavior changes, and run the backend test suite plus frontend lint and build before opening a pull request.

## AI Usage

### AI Tool: Google Antigravity

Google Antigravity was used as an AI engineering and development tool for:

- implementation assistance
- debugging
- configuration and deployment assistance
- code improvement and refactoring
- testing assistance
- documentation and README assistance

The developer reviewed and tested the resulting work and remains responsible for understanding the implementation, validating behavior, and making final engineering decisions.

### Accepted suggestion

Use a Prisma `Serializable` transaction for ride matching and capacity enforcement. This was accepted because concurrent passengers must not claim more seats than the Tesla capacity allows, and PostgreSQL can reject conflicting transactions safely.

### Rejected/Modified suggestion

Use WebSockets for ride status updates in the MVP. This was modified to use REST polling instead, keeping the deployment and operational model simpler while the product has low traffic and no live vehicle-location requirement.
