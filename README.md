# Dhaka Tesla Pool — Full Stack MVP

## Summary & Problem Statement

**Dhaka Tesla Pool** is a ride-sharing MVP designed to solve the chaotic commute in Dhaka by letting passengers share a fixed-capacity Tesla to compatible destinations. The primary problem is matching riders (like Nusrat and Rafiq) efficiently without exceeding the 3-seat capacity of vehicles (like Jashim's Bullet), calculating fair split fares, and managing the ride lifecycle while avoiding race conditions during bookings.

## Features Implemented
- **Passenger Flow**: Sign up/in, request a ride with specific seats, view estimated/pooled fare, track status, and view history.
- **Driver Flow**: Sign up/in, toggle online status, accept rides, advance ride states, and see pool capacity.
- **Pooling Logic**: Automatically match compatible requests (e.g., Banani → Mohakhali and Banani → Gulshan 1) into a single pool without exceeding vehicle capacity.
- **Fare Model**: Base fare + distance charge - pool discount.

*(Screenshots and GIFs will be added in the release documentation)*

## Architecture Diagram

```mermaid
flowchart TD
    Client[Browser / Next.js SSR] -->|REST API| API[Node.js / Express API]
    API -->|Prisma ORM| DB[(PostgreSQL)]
    
    sublayer[Business Logic]
    API -.-> Matcher[Pool Matcher]
    API -.-> State[State Machine]
    API -.-> Fare[Fare Calculator]
```

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ DRIVER : "has"
    USER ||--o{ RIDE : "books"
    DRIVER ||--o| TESLA : "drives"
    TESLA ||--o{ POOL : "hosts"
    POOL ||--o{ POOL_MEMBERSHIP : "contains"
    RIDE ||--o| POOL_MEMBERSHIP : "belongs to"
    RIDE }o--|| ZONE : "pickup/destination"
    RIDE ||--o{ RIDE_HISTORY : "tracks"
```

## Tech Stack & Justification

- **Frontend**: Next.js (App Router), React. *Why*: Provides excellent SSR, simple routing, and built-in API integration capabilities for a fast MVP.
- **Backend**: Node.js + Express. *Why*: Lightweight, easy to set up, and unopinionated, allowing explicit control over transaction boundaries and state machine logic without the overhead of NestJS.
- **Database**: PostgreSQL. *Why*: Relational data is crucial for this domain (users, rides, pools). Postgres handles `Serializable` transactions natively, which is vital for preventing overbooking (the concurrency problem).
- **ORM**: Prisma. *Why*: Type-safe database access and easy migrations.
- **Auth**: JWT. *Why*: Stateless, standard, and easy to deploy in an MVP.

## Project Structure
- `/backend`: Express API, Prisma schema, tests, and business logic.
- `/frontend`: Next.js application, React components, and context.
- `docker-compose.yml`: Container orchestration.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (if running locally without Docker)

## Environment Variables

An example `.env.example` is provided in both `frontend` and `backend` directories. Never commit real secrets.
```env
# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/dhaka_tesla_pool?schema=public
JWT_SECRET=your_secret_key_here
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Local Setup & Docker Instructions

1. **Clone & Env setup**:
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   cp .env.example .env
   ```

2. **Run via Docker**:
   ```bash
   docker compose up --build
   ```
   The backend container automatically runs Prisma migrations (`prisma migrate deploy`) and seeds the database (`prisma db seed`).

## Running Locally (Without Docker)

**Backend**:
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Testing (Backend)**:
```bash
cd backend
npm test
```

## Demo Credentials

Password for all users: `Password123!`
- Driver: `jashim@example.com` (Drives "Bullet", Capacity 3)
- Passengers: `nusrat@example.com`, `rafiq@example.com`, `shirin@example.com`

## API Overview

- `POST /api/auth/login`: Authenticate and receive JWT.
- `POST /api/rides`: Request a new ride.
- `POST /api/rides/:id/match`: (Driver) Match an existing ride into a new or existing pool.
- `PATCH /api/rides/:id/status`: (Driver) Advance ride status.
- `GET /api/rides/history`: (Passenger) View history.

## Key Decisions, Trade-offs & Limitations

- **Concurrency Handling**: To prevent overbooking when two users (e.g. Nusrat and Shirin) try to claim the last seat simultaneously, we use a `Serializable` database transaction during the matching process. If both transactions read the same available seat count, the second one to commit will fail and throw a serialization error. This ensures Bullet's capacity is mathematically impossible to exceed.
- **Trade-off**: Serializable transactions are safe but slow at high concurrency and can cause retries. At scale, this would be a bottleneck.
- **Geography**: We use hardcoded predefined zones (Banani, Gulshan 1, etc.) instead of a mapping API to keep the focus on state and pooling logic.
- **Limitation**: The matching logic is currently very basic (matching strictly compatible hardcoded routes).

## AI Usage

- **Tools Used**: Gemini 3.1 Pro (High)
- **What For**: To review and refactor the codebase to align exactly with the strict PRD, implement robust testing, and generate the Git history.
- **Accepted Suggestion**: Using `Serializable` isolation level in Prisma `$transaction` specifically for the `matchRide` controller to prevent the classic race condition when two passengers book the last seat.
- **Rejected/Changed Suggestion**: AI initially suggested using Redis for locking seats. I rejected this because introducing Redis violates the architectural constraint to "add complexity only when there is a reason". Postgres `Serializable` transactions are perfectly sufficient for the MVP scale.

## Video Demo & Deployment

- **Demo Video**: [Link to Loom Video](#) *(Placeholder)*
- **Deployment URL**: [Link to Vercel/Render](#) *(Placeholder)*

## Bonus: If Oi Tesla Goes Viral (Scaling to 1M Passengers)

If this scales to 1M passengers and 100k drivers, the current `Serializable` transaction bottleneck will fail under load.

**Scaling Strategy**:
1. **Load Balancing & Horizontal Scaling**: Put the Express API behind an API Gateway (AWS API Gateway or NGINX) and scale it horizontally using container orchestration (ECS/EKS).
2. **Database Strategy**: 
   - Move from single Postgres instance to Primary-Replica architecture (read replicas for history/status).
   - Use PostGIS for actual geospatial indexing instead of string matching zones.
3. **Concurrency & Matching (Redis + Queues)**:
   - Instead of locking in Postgres, use Redis to track real-time available seats in specific pools.
   - Ride requests go into a Kafka/RabbitMQ queue. Dedicated "Matcher" worker services consume the queue, match riders asynchronously, and claim seats in Redis atomically (using Lua scripts).
   - Once matched, the worker persists the final state to Postgres. This offloads the high-contention matching logic from the main relational DB.
4. **Real-time**: Replace polling with WebSockets (Socket.io) or Server-Sent Events (SSE) for driver locations and ride status updates.

### UI Redesign 2.0
*Screenshots of the new Premium Dark Mode UI have been updated in the release docs.*