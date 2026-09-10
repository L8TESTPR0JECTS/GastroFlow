<div align="center">

# GastroFlow API

### The operational core behind restaurant inventory intelligence

<p>
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.7">
  <img src="https://img.shields.io/badge/Firestore-persistence-FFCA28?style=flat-square&logo=firebase&logoColor=111827" alt="Firestore">
  <img src="https://img.shields.io/badge/Kafka-events-231F20?style=flat-square&logo=apachekafka&logoColor=white" alt="Kafka">
  <img src="https://img.shields.io/badge/RabbitMQ-work-FF6600?style=flat-square&logo=rabbitmq&logoColor=white" alt="RabbitMQ">
  <img src="https://img.shields.io/badge/Redis-cache-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
</p>

<p>
  <a href="../README.md">Project overview</a> |
  <a href="../gasroflowui/docs/API_CONTRACTS.md">Frontend contracts</a> |
  <a href="./postman/">Postman collections</a>
</p>

</div>

---

## What this service does

GastroFlow API models the operational life of a restaurant's ingredients. It is responsible for the state changes that matter after a delivery, during a service, and at the end of a shift:

```text
Restaurant
  -> ingredients
  -> inventory batches
  -> recipes
  -> sales and stock movements
  -> waste events
  -> recommendations
  -> simulations and dashboard insight
```

The service is deliberately event-aware. A request can update the current state while also publishing a domain event, queuing work, invalidating a live dashboard, or creating a durable record for later processing.

## Product surface

| Module | Responsibility | Main route prefix |
| --- | --- | --- |
| Restaurants | Restaurants, locations, and members | `/restaurants` |
| Ingredients | Ingredient catalog and risk metadata | `/restaurants/:restaurantId/ingredients` |
| Inventory batches | Stock quantities, statuses, and batch lifecycle | `/restaurants/:restaurantId/inventory-batches` |
| Recipes | Recipes and recipe economics | `/restaurants/:restaurantId/recipes` |
| Stock consumption | Recipe-sale consumption and movement history | `/restaurants/:restaurantId/stock-consumptions` |
| Waste events | Waste recording and remaining-batch effects | `/restaurants/:restaurantId/waste-events` |
| Recommendations | Generate, apply, and dismiss operational actions | `/restaurants/:restaurantId/recommendations` |
| Dashboard | Cross-module operational summary | `/restaurants/:restaurantId/dashboard` |
| Simulations | Timeline and scenario experiments | `/restaurants/:restaurantId/simulations` |

The complete frontend-facing contract is maintained in [../gasroflowui/docs/API_CONTRACTS.md](../gasroflowui/docs/API_CONTRACTS.md).

## Architecture at a glance

```mermaid
flowchart TB
    CLIENT[React operations console]
    HTTP[NestJS HTTP controllers]
    DOMAIN[Domain services]
    STORE[(Firestore)]
    EVENTS[Domain event envelopes]
    OUTBOX[(Outbox records)]
    INBOX[(Inbox deduplication)]
    KAFKA[(Kafka)]
    RABBIT[(RabbitMQ confirmed tasks)]
    REDIS[(Redis)]
    SOCKET[Socket.IO dashboard gateway]

    CLIENT --> HTTP
    HTTP --> DOMAIN
    DOMAIN --> STORE
    DOMAIN --> EVENTS
    EVENTS --> OUTBOX
    OUTBOX --> KAFKA
    KAFKA --> INBOX
    INBOX --> DOMAIN
    DOMAIN --> RABBIT
    DOMAIN --> REDIS
    DOMAIN --> SOCKET
    SOCKET --> CLIENT
```

### Why these pieces exist

- **Firestore** is the source of operational state: restaurants, ingredients, batches, recipes, movements, waste, and recommendations.
- **Domain events** make important state transitions explicit and portable.
- **Outbox and inbox boundaries** provide a place to make event publication and consumption durable and idempotent.
- **Kafka** is the long-lived event stream for change propagation and consumers.
- **RabbitMQ** handles task-shaped work such as replenishment report generation, with publisher confirms and a dead-letter route.
- **Redis** is available for fast cache and coordination paths.
- **Socket.IO** lets dashboard clients subscribe to a restaurant room and receive `dashboard.updated` invalidations.

## API highlights

### Operational state

```http
POST /restaurants/seed/demo
GET  /restaurants/:restaurantId/dashboard/summary
GET  /restaurants/:restaurantId/ingredients?isActive=true
GET  /restaurants/:restaurantId/inventory-batches?isActive=true
GET  /restaurants/:restaurantId/recipes?isActive=true
```

### Decisions and consequences

```http
POST  /restaurants/:restaurantId/stock-consumptions/recipe-sale
POST  /restaurants/:restaurantId/waste-events
POST  /restaurants/:restaurantId/recommendations/generate
PATCH /restaurants/:restaurantId/recommendations/:recommendationId/apply
PATCH /restaurants/:restaurantId/recommendations/:recommendationId/dismiss
```

### Simulations

```http
POST /restaurants/:restaurantId/simulations/timeline/lunch-rush
POST /restaurants/:restaurantId/simulations/timeline/full-day
POST /restaurants/:restaurantId/simulations/timeline/week
POST /restaurants/:restaurantId/simulations/scenario/supplier-delivery
POST /restaurants/:restaurantId/simulations/scenario/waste-spike
POST /restaurants/:restaurantId/simulations/scenario/overbuying
POST /restaurants/:restaurantId/simulations/scenario/follow-recommendations
POST /restaurants/:restaurantId/simulations/scenario/ignore-recommendations
```

### Realtime contract

Clients join a restaurant-scoped room:

```text
client -> dashboard.subscribe { restaurantId }
server -> dashboard.updated { restaurantId, occurredAt }
```

The update is intentionally an invalidation signal. The console refetches the typed dashboard summary instead of trying to rebuild business state from a partial socket payload.

## Local development

### Prerequisites

- Node.js with npm
- Docker Desktop or another Docker runtime
- Firebase CLI if you want to run the Firestore emulator

### Install dependencies

```bash
npm install
```

### Start infrastructure

```bash
docker compose up -d
```

The compose file starts:

| Service | Local address | Used for |
| --- | --- | --- |
| Kafka | `localhost:9092` | Event streaming |
| Redis | `localhost:6379` | Cache and coordination |
| RabbitMQ | `localhost:5672` | Confirmed asynchronous tasks |
| RabbitMQ management | `http://localhost:15672` | Local queue inspection |

RabbitMQ uses `guest` / `guest` in the local compose environment.

### Start the API

```bash
npm run start:dev
```

The root route is available at `GET /` and returns the NestJS app greeting. The product routes are grouped under restaurant-scoped prefixes listed above.

### Local environment

The service has useful local defaults, but these variables make the runtime explicit:

| Variable | Example | Purpose |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `gastroflow-local` | Firebase project ID |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` | Connect to the Firestore emulator |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | RabbitMQ connection URL |
| `KAFKA_CLIENT_ID` | `gastroflow-api` | Kafka client identity |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka brokers |

For the Firestore emulator, use the project ID `gastroflow-local` and start only Firestore:

```bash
npm run firebase:emulators
```

## Tests and quality checks

```bash
# Compile the service
npm run build

# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:cov

# Formatting and linting
npm run format
npm run lint
```

Focused tests are colocated with the behavior they protect. The inventory replenishment area is a useful example because it covers policy decisions, service behavior, controller behavior, integration behavior, and the asynchronous replenishment report worker.

## Project layout

```text
src/
|- common/
|  |- events/       Event envelopes and publishers
|  |- firestore/    Firebase Admin and Firestore provider
|  |- inbox/        Consumer-side deduplication boundary
|  |- kafka/        Kafka producer and consumer lifecycle
|  |- outbox/       Durable event publication boundary
|  |- rabbitmq/     Confirmed task publishing and queue topology
|  |- redis/        Cache and Redis lifecycle
|  `- websockets/   Dashboard gateway and room updates
|- event-processing/ Event consumer composition
|- modules/
|  |- dashboard/
|  |- ingredients/
|  |- inventory-batches/
|  |- recipes/
|  |- recommendations/
|  |- restaurants/
|  |- simulations/
|  |- stock-consumptions/
|  `- waste-events/
`- main.ts
```

Postman collections for the product modules live in [postman/](./postman/). The Docker topology is defined in [docker-compose.yml](./docker-compose.yml).

## Working agreements for contributors

When adding a workflow, keep its path easy to follow:

1. Define the request and response shape in a DTO or model.
2. Keep business rules in the module service rather than the controller.
3. Persist state changes through the module repository.
4. Publish an event when another part of the system needs to react.
5. Add a focused test for the decision and its failure path.
6. Update the frontend contract or Postman collection when the public surface changes.

The API is evolving alongside the product. Clear boundaries and observable transitions matter more here than pretending the domain is already finished.

## Related documentation

- [GastroFlow product and repository overview](../README.md)
- [Frontend API contracts](../gasroflowui/docs/API_CONTRACTS.md)
- [Postman collections](./postman/)
- [NestJS documentation](https://docs.nestjs.com/)
