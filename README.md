# Multi-Tenant POS SaaS System

This repository contains the scaffolded foundation of a scalable, Multi-Tenant Point of Sale (POS) Software-as-a-Service system based on Spring Boot 3.x and React (Next.js) 14+.

## Architecture Overview

The architecture utilizes a **Modular Monolith** pattern on the backend and a **Turborepo**-managed Multi-App Workspace on the frontend.

### 1. Backend (Spring Boot 3.2.x)
- **Language**: Java 21
- **Build Tool**: Maven
- **Core Frameworks**: Spring Boot, Spring Data JPA, Hibernate 6
- **Database**: PostgreSQL
- **Multi-Tenancy Model**: Shared Database, Shared Schema isolated via Hibernate `@TenantId`
- **Module Structure**:
  - `tenant`: Manages subscription tiers and tenant lifecycles.
  - `catalog`: Manages product catalogs and categories.
  - `inventory`: Manages warehouse locations and stock.
  - `pos`: Handles checkout and outbox event creation.
  - `payment`: Implements strategy pattern for varying payment gateways (Stripe, Adyen, etc.).

### 2. Frontend (Turborepo & Next.js)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Frameworks**: Next.js (App Router), React, TailwindCSS
- **Apps**:
  - `pos-terminal`: The point-of-sale interface used by store cashiers. Implements a "local-first" architecture using Dexie.js (IndexedDB) for seamless offline checkout.
  - `tenant-backoffice`: The dashboard for individual store owners to manage catalogs, inventory, and employees.
  - `super-admin`: The SaaS management plane to provision and observe tenants.

---

## Getting Started

### Prerequisites
- Java 21
- Maven
- Node.js (v18+)
- pnpm (v12+)
- PostgreSQL (running locally or via Docker)

### Running the Backend
1. Start your local PostgreSQL instance on port `5432`.
2. Ensure you have a database named `pos` (or update `src/main/resources/application.properties`).
3. Compile and Run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Running the Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   cd frontend
   pnpm install
   ```
3. Run all applications concurrently in development mode:
   ```bash
   pnpm run dev
   ```
4. Access the applications:
   - Super Admin Dashboard: `http://localhost:3000` (Port may vary depending on Next.js auto-assignment)
   - Tenant Backoffice: `http://localhost:3001`
   - POS Terminal: `http://localhost:3002`

## Key Implementation Details
- **Cross-Module Communication**: The backend enforces the `TenantAwareEntity` mapped superclass for strict tenant isolation. Modules communicate via UUIDs rather than direct JPA relations where crossing domain boundaries.
- **Offline Reliability**: The `pos-terminal` app utilizes `dexie` and `dexie-react-hooks` to store orders locally in IndexedDB when internet connectivity drops, synchronizing them when connection is restored.
- **Payment Extensibility**: The `PaymentGatewayPort` provides a clean Strategy pattern interface, allowing seamless addition of new payment providers without touching core POS logic.
