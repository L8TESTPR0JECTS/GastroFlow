# GastroFlow UI

Operational restaurant dashboard for the GastroFlow backend.

## Run

```bash
npm install
npm run dev
```

Environment:

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_DEFAULT_RESTAURANT_ID=rest_demo_001
```

The UI centralizes backend calls in `src/api/gastroflowApi.ts` and loads dashboard data through `src/api/dashboardData.ts`. Dashboard data and live refresh status are kept in a focused Redux slice at `src/store/dashboardSlice.ts`; `src/realtime/useDashboardSocket.ts` subscribes to dashboard update events and refetches through the same data boundary.

Implemented features:

- Dashboard summary metrics for revenue, gross profit, inventory value, waste cost, and open recommendations.
- Inventory batch table.
- Recipe sale recording through the stock-consumption contract.
- Waste recording against existing inventory batches.
- Open recommendation list with generate, apply, and dismiss actions.
- Recipe and ingredient operating panels.
- Supported simulation scenarios.
- Loading, empty, and error states.
- Socket.IO live dashboard refresh after stock sale updates.

Contract documentation: `docs/API_CONTRACTS.md`.
