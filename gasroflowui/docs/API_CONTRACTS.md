# GastroFlow Frontend API Contracts

Sources inspected:

- Backend controllers under `gastroflow-api/src/modules`
- Postman collections under `gastroflow-api/postman`
- `gastroflow-api/gastroflow-module-5-stock-consumptions.postman_collection.json`
- `gastroflow-api/src/common/websockets/dashboard.gateway.ts`
- `gastroflow-api/scripts/dashboard-socket-client.mjs`

The frontend only calls the endpoints listed below. API base URL is read from `VITE_API_BASE_URL`; Socket.IO URL is read from `VITE_SOCKET_URL` and falls back to `VITE_API_BASE_URL`; default restaurant ID is read from `VITE_DEFAULT_RESTAURANT_ID`.

## Endpoints Used

| Method | Path | Request | Response | Frontend feature |
| --- | --- | --- | --- | --- |
| `POST` | `/restaurants/seed/demo` | No body | `{ restaurant, location, members }` | Seed demo restaurant button |
| `GET` | `/restaurants/:restaurantId/dashboard/summary` | Optional query `{ range?: string }` | `RestaurantDashboardSummary` with inventory, finance, waste, recommendations, recipes, and activity summaries | Top metrics, low-level dashboard summary, recent activity |
| `POST` | `/restaurants/:restaurantId/ingredients/seed/demo` | No body | `{ restaurantId, ingredientsCreated, ingredients }` | Seed demo data flow |
| `GET` | `/restaurants/:restaurantId/ingredients?isActive=true` | Query `{ category?, wasteRiskLevel?, isActive? }` | `Ingredient[]` | Ingredients catalog panel |
| `POST` | `/restaurants/:restaurantId/inventory-batches/seed/demo` | No body | `{ restaurantId, inventoryBatchesCreated, inventoryBatches }` | Seed demo data flow |
| `GET` | `/restaurants/:restaurantId/inventory-batches?isActive=true` | Query `{ ingredientId?, locationId?, status?, isActive? }` | `InventoryBatch[]` | Inventory batch table and waste batch selector |
| `POST` | `/restaurants/:restaurantId/recipes/seed/demo` | No body | `{ restaurantId, recipesCreated, recipes }` | Seed demo data flow |
| `GET` | `/restaurants/:restaurantId/recipes?isActive=true` | Query `{ category?, status?, isActive? }` | `Recipe[]` | Recipe economics panel and sale recipe selector |
| `POST` | `/restaurants/:restaurantId/stock-consumptions/recipe-sale` | `{ recipeId: string, quantitySold: number, notes?: string }` | `RecipeSaleConsumptionResult` with sale totals, ingredient summaries, and stock movements | Record recipe sale action, revenue/profit refresh |
| `GET` | `/restaurants/:restaurantId/stock-consumptions/movements` | Query `{ ingredientId?, inventoryBatchId?, recipeId?, movementType?, source? }` | `StockMovement[]` | Recent activity fallback and movement visibility |
| `POST` | `/restaurants/:restaurantId/waste-events` | `{ inventoryBatchId: string, quantityWasted: number, reason: WasteReason, notes?: string }` | `WasteEventResult` with created waste event, stock movement, remaining batch quantity, and batch status | Record waste action and waste/inventory refresh |
| `GET` | `/restaurants/:restaurantId/waste-events` | Query `{ ingredientId?, inventoryBatchId?, reason? }` | `WasteEvent[]` | Waste activity fallback |
| `POST` | `/restaurants/:restaurantId/recommendations/generate` | `{ notes?: string }` | `{ restaurantId, generatedCount, recommendations }` | Generate recommendations action |
| `GET` | `/restaurants/:restaurantId/recommendations?status=OPEN` | Query `{ type?, priority?, status?, ingredientId?, recipeId? }` | `Recommendation[]` | Open recommendations panel |
| `PATCH` | `/restaurants/:restaurantId/recommendations/:recommendationId/apply` | No body | `Recommendation` | Apply recommendation action |
| `PATCH` | `/restaurants/:restaurantId/recommendations/:recommendationId/dismiss` | No body | `Recommendation` | Dismiss recommendation action |
| `POST` | `/restaurants/:restaurantId/simulations/timeline/full-day` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Full-day simulation |
| `POST` | `/restaurants/:restaurantId/simulations/timeline/week` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Week simulation |
| `POST` | `/restaurants/:restaurantId/simulations/timeline/lunch-rush` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Lunch-rush simulation |
| `POST` | `/restaurants/:restaurantId/simulations/scenario/supplier-delivery` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Supplier-delivery simulation |
| `POST` | `/restaurants/:restaurantId/simulations/scenario/waste-spike` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Waste-spike simulation |
| `POST` | `/restaurants/:restaurantId/simulations/scenario/overbuying` | `{ intensity?, startsAt?, endsAt?, seed?, notes? }` | `SimulationResult` | Overbuying simulation |
| `POST` | `/restaurants/:restaurantId/simulations/scenario/follow-recommendations` | `{ intensity?, startsAt?, endsAt?, seed?, notes?, maxRecommendations? }` | `SimulationResult` | Follow-recommendations simulation |
| `POST` | `/restaurants/:restaurantId/simulations/scenario/ignore-recommendations` | `{ intensity?, startsAt?, endsAt?, seed?, notes?, maxRecommendations? }` | `SimulationResult` | Ignore-recommendations simulation |

## Realtime Contract Used

| Transport | Direction | Event | Request | Response | Frontend feature |
| --- | --- | --- | --- | --- | --- |
| `Socket.IO` | Client to server | `dashboard.subscribe` | `{ restaurantId: string }` | No acknowledgement body documented | Subscribe the active restaurant dashboard to live stock-change invalidation |
| `Socket.IO` | Server to client | `dashboard.updated` | No client request body | `{ restaurantId: string, occurredAt: string }` | Mark the dashboard as updated and refetch `/restaurants/:restaurantId/dashboard/summary` through the existing typed API path |

## Missing Contracts Not Mocked

- No endpoint exists to list all restaurants, so the UI uses a restaurant ID input instead of a restaurant picker.
- No endpoint exists for historical time-series revenue, profit, inventory value, or waste trends, so the UI does not render charts that would require invented data.
- No endpoint exists for user authentication or authorization, so the UI does not show login, roles, or permissions.
