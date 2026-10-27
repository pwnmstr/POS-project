# Multi-Tenant POS SaaS System Architecture (Spring Boot & React)

## 1. Architectural Philosophy & Executive Summary

To satisfy the core requirements of **extensibility**, **maintainability**, and **factual correctness** for a Point of Sale (POS) SaaS platform, this architecture adopts two foundational paradigms:

1. **Backend: Hexagonal Modular Monolith (Microservice-Ready)** Instead of starting with a distributed microservices mesh—which introduces high operational overhead, distributed transaction complexity, and maintenance friction—the backend is designed as a **Modular Monolith** using **Spring Boot 3.x** and **Spring Modulith** principles with **Hexagonal (Ports and Adapters) Architecture**. Modules interact strictly via public APIs and asynchronous domain events, allowing individual modules (e.g., Order Processing, Inventory, Billing) to be extracted into standalone microservices only when scaling metrics demand it.

2. **Frontend: Offline-First Progressive Web App (PWA)** A POS system cannot stop functioning when a retail store loses internet connectivity. The **React 18+** frontend is architected as a **Local-First PWA** utilizing **IndexedDB** for local persistence and an asynchronous background synchronization engine to reconcile offline sales with the Spring Boot backend once connectivity is restored.

## 2. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                           CLIENT TIER (Retail Store / Edge)                       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                     React 18+ POS Terminal (PWA)                            |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  | UI Components     |  | State Management   |  | Hardware Abstraction   |  |  |
|  |  | (POS / Backoffice)|  | (Zustand +         |  | (WebUSB / WebSerial /  |  |  |
|  |  |                   |  |  TanStack Query)   |  |  ESC-POS / Cloud EMV)  |  |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |                                   |                                         |  |
|  |  +--------------------------------v--------------------------------------+  |  |
|  |  |             Local Storage & Sync Engine (IndexedDB / Dexie.js)        |  |  |
|  |  |             [Product Catalog Cache]   [Offline Order Outbox]          |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------|-----------------------------------------+  |
+--------------------------------------|--------------------------------------------+
                                       | HTTPS / REST / WebSockets (WSS)
                                       v
+-----------------------------------------------------------------------------------+
|                                 EDGE / GATEWAY TIER                               |
|  [Cloudflare / AWS WAF] ---> [API Gateway / Nginx] ---> [Keycloak / OAuth2 IdP]   |
+--------------------------------------|--------------------------------------------+
                                       | JWT (Contains `tenant_id`, `store_id`)
                                       v
+-----------------------------------------------------------------------------------+
|                         APPLICATION TIER (Spring Boot 3.x)                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Security & Tenant Filter Chain                                              |  |
|  | [JWT Validator] -> [TenantContextFilter] -> [RateLimiter (Bucket4j)]        |  |
|  +-----------------------------------|-----------------------------------------+  |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  | Modular Domain Core (Spring Modulith / Hexagonal Architecture)              |  |
|  |                                                                             |  |
|  |  +----------------+  +----------------+  +----------------+  +-----------+  |  |
|  |  | Tenant & IAM   |  | Catalog &      |  | POS Order &    |  | Payment   |  |  |
|  |  | Module         |  | Inventory Mod. |  | Sync Module    |  | Gateway   |  |  |
|  |  +----------------+  +----------------+  +----------------+  +-----------+  |  |
|  |          ^                   ^                   |                 |        |  |
|  |          +-------------------|-------------------+-----------------+        |  |
|  |                              v                                              |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |Transactional Outbox & Event Bus (Spring Events / Kafka / RabbitMQ)   |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------|-----------------------------------------+  |
+--------------------------------------|--------------------------------------------+
                                       |
         +-----------------------------+-----------------------------+
         |                                                           |
         v                                                           v
+---------------------------------------+   +---------------------------------------+
|       DATA & PERSISTENCE TIER         |   |      EXTERNAL INTEGRATIONS TIER       |
|                                       |   |                                       |
| - PostgreSQL 16 (Primary + Read Repl) |   | - Payment Gateways (Stripe, Adyen)    |
|   * Hibernate 6 @TenantId             |   | - Accounting (QuickBooks, Xero)       |
|   * Row-Level Security (RLS)          |   | - E-Commerce (Shopify, WooCommerce)   |
| - Redis Cluster (Cache & Locks)       |   | - Messaging (Twilio, SendGrid)        |
| - S3 / Object Storage (Receipts/Imgs) |   |                                       |
+---------------------------------------+   +---------------------------------------+

```

## 3. Multi-Tenancy Strategy

### 3.1 Data Isolation Models & Selection

In a multi-tenant SaaS system, there are three primary data isolation strategies:

1. **Database-per-Tenant**: Highest isolation, highest infrastructure cost and migration complexity.

2. **Schema-per-Tenant**: Moderate isolation, high operational overhead when running Flyway/Liquibase migrations across thousands of schemas.

3. **Shared Database, Shared Schema (Discriminator Column + Row-Level Security)**: Lowest infrastructure cost, instantaneous tenant provisioning, and unified database migrations.

**Architectural Decision**: We use **Shared Database, Shared Schema with Hibernate 6 `@TenantId` backed by PostgreSQL Row-Level Security (RLS)** as the default for standard SaaS tiers, coupled with a routing abstraction that allows **Database-per-Tenant** isolation for Enterprise tier clients.

### 3.2 Tenant Resolution & Propagation Lifecycle

1. **Authentication**: When a cashier or manager logs in, the Identity Provider (e.g., Keycloak or Spring Authorization Server) issues a signed JWT containing custom claims: `tenant_id`, `store_id`, `roles`, and `subscription_tier`.

2. **Ingestion (`TenantContextFilter`)**: A Spring `OncePerRequestFilter` intercepts every incoming HTTP request, extracts the `tenant_id` from the validated `SecurityContext`, and binds it to a thread-safe `TenantContext` holder.

3. **ORM Enforcement (Hibernate 6)**: Implementing `CurrentTenantIdentifierResolver<UUID>` instructs Hibernate to automatically inject `WHERE tenant_id = ?` into every SQL `SELECT`, `UPDATE`, and `DELETE` query, and populate `tenant_id` on every `INSERT`.

4. **Database Defense-in-Depth (PostgreSQL RLS)**: To protect against developer error (e.g., native SQL queries bypassing Hibernate's AST parser), a `DataSource` decorator executes `SET LOCAL app.current_tenant_id = '<tenant_uuid>'` at the start of every database transaction. PostgreSQL enforces a policy:

   ```
   CREATE POLICY tenant_isolation_policy ON orders
       USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

   ```

```
// Spring Boot 3 / Hibernate 6 Multi-Tenant Entity Base Class
@MappedSuperclass
@Getter
@Setter
public abstract class TenantAwareEntity {

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

```

## 4. Backend Architecture (Spring Boot 3.x)

### 4.1 Package & Module Structure (Hexagonal + Spring Modulith)

Each domain module encapsulates its own internal logic and exposes only an explicit API package and Domain Events. Cross-module database joins are strictly forbidden; modules reference other modules' entities by `UUID` only.

```
com.pos.saas
├── common/                         # Shared kernel (TenantContext, Exceptions, Outbox)
├── modules/
│   ├── tenant/                     # Tenant onboarding, subscription tiers, feature flags
│   ├── catalog/                    # Products, variants, categories, pricing rules, taxes
│   ├── inventory/                  # Stock ledger, warehouses, low-stock alerts
│   ├── pos/                        # Register shifts, cart calculation, order creation
│   │   ├── domain/                 # Pure Java domain models & business rules (No Spring annotations)
│   │   ├── application/            # Use cases, ports (inbound/outbound interfaces)
│   │   └── infrastructure/         # Adapters (Spring Data JPA repositories, REST controllers)
│   ├── payment/                    # Payment processing, split tenders, refunds
│   └── integration/                # Webhooks, ERP/Accounting sync, E-commerce connectors
└── Application.java

```

### 4.2 Extensibility Patterns

To make the backend easily extensible without modifying core domain code (Open-Closed Principle):

#### A. Strategy & Factory Pattern for Payment & Tax Engines

Different tenants operate in different regions and use different payment processors (Stripe Terminal, Adyen, Square, Razorpay) and tax regimes (US Sales Tax, EU VAT, India GST).

```
public interface PaymentGatewayPort {
    PaymentProviderType getProviderType();
    PaymentResponse authorizeAndCapture(UUID tenantId, PaymentRequest request);
    RefundResponse refund(UUID tenantId, RefundRequest request);
}

```

Spring automatically injects `List<PaymentGatewayPort>` into a `PaymentGatewayRegistry`. Adding a new payment gateway requires only creating a new `@Component` implementing `PaymentGatewayPort`—zero modifications to the core checkout service.

#### B. Transactional Outbox Pattern for Event-Driven Extensibility

When a POS terminal completes an order, multiple side effects must occur:

* Deduct inventory

* Update daily sales analytics

* Dispatch digital receipt via SMS/Email

* Trigger external webhooks (e.g., sync to QuickBooks)

Instead of executing these synchronously (which increases checkout latency and creates brittle coupling), the `pos` module writes the `Order` and an `OrderCompletedEvent` into the `outbox_events` table within the **same ACID transaction**. Spring Modulith's Event Publication Registry (or Debezium/Scheduler) asynchronously dispatches the event to internal listeners and external webhook workers with guaranteed **At-Least-Once** delivery.

## 5. Frontend Architecture (React 18+)

### 5.1 Multi-App Monorepo Structure (Turborepo)

A POS SaaS requires distinct user interfaces optimized for different personas. Using a **Turborepo** workspace allows sharing UI primitives, validation schemas, and API clients while deploying independent apps:

* `apps/pos-terminal`: Touch-optimized, offline-first PWA used by cashiers at the register.

* `apps/tenant-backoffice`: Data-heavy dashboard for store managers (inventory management, staff scheduling, analytics).

* `apps/super-admin`: Control plane for the SaaS owner (tenant provisioning, billing, global monitoring).

* `packages/ui`: Shared TailwindCSS + Radix UI component library.

* `packages/calculation-engine`: Shared TypeScript library containing deterministic pricing, discount, and tax math (using `decimal.js` to avoid IEEE 754 floating-point errors).

### 5.2 Offline-First Engine & Synchronization Flow

Retail internet connections are unreliable. The `pos-terminal` app operates on a **Local-First** architecture:

```
+-------------------------------------------------------------------------+
|                        REACT POS TERMINAL (PWA)                         |
|                                                                         |
|  1. Cashier scans barcode                                               |
|         |                                                               |
|         v                                                               |
|  [Local IndexedDB (Dexie.js)] ---> Instant Product & Price Lookup (<5ms)|
|         |                                                               |
|  2. Cashier completes checkout (Cash or Offline-capable Card Terminal)  |
|         |                                                               |
|         v                                                               |
|  [Write Order to Local `offline_orders_queue` with UUIDv7 +

```