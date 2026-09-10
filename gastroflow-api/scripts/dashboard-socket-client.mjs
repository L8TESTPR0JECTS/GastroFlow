import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000';
const restaurantId = 'rest_demo_001';

const socket = io(API_URL);

async function fetchDashboard() {
  const response = await fetch(
    `${API_URL}/restaurants/${restaurantId}/dashboard/summary`
  );

  const dashboard = await response.json();

  console.log('Fresh dashboard values:');
  console.log({
    generatedAt: dashboard.generatedAt,
    totalSalesRevenue: dashboard.finance.totalSalesRevenue,
    inventoryCostConsumed: dashboard.finance.inventoryCostConsumed,
    estimatedGrossProfit: dashboard.finance.estimatedGrossProfit,
    unitsSold: dashboard.finance.unitsSold
  });
}

socket.on('connect', async () => {
  console.log(`Connected: ${socket.id}`);

  socket.emit('dashboard.subscribe', {
    restaurantId
  });

  console.log(`Subscribed to restaurant:${restaurantId}`);

  await fetchDashboard();
});

socket.on('dashboard.updated', async (payload) => {
  console.log('\n⚡ dashboard.updated received:');
  console.log(payload);

  console.log('\nFetching fresh dashboard...');

  await fetchDashboard();
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});