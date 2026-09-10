import type {
  CreateRecipeSaleConsumptionDto,
  CreateWasteEventDto,
  GenerateRecommendationsResult,
  Ingredient,
  InventoryBatch,
  Recipe,
  RecipeSaleConsumptionResult,
  Recommendation,
  RestaurantDashboardSummary,
  RunSimulationDto,
  SeedRestaurantResult,
  SimulationResult,
  StockMovement,
  WasteEvent,
  WasteEventResult,
} from './types';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

type QueryValue = string | number | boolean | undefined | null;
type QueryParams = Record<string, QueryValue>;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit & { query?: QueryParams } = {},
): Promise<TResponse> {
  const url = new URL(`${apiBaseUrl}${path}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const body = contentType?.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const message = typeof body === 'object' && body !== null && 'message' in body ? String(body.message) : fallback;
    throw new ApiError(message, response.status, body);
  }

  return body as TResponse;
}

const restaurantPath = (restaurantId: string, suffix: string) =>
  `/restaurants/${encodeURIComponent(restaurantId)}${suffix}`;

export const gastroflowApi = {
  baseUrl: apiBaseUrl,

  seedDemoRestaurant: () => request<SeedRestaurantResult>('/restaurants/seed/demo', { method: 'POST' }),

  getDashboardSummary: (restaurantId: string, range?: string) =>
    request<RestaurantDashboardSummary>(restaurantPath(restaurantId, '/dashboard/summary'), {
      query: { range },
    }),

  seedDemoIngredients: (restaurantId: string) =>
    request<{ restaurantId: string; ingredientsCreated: number; ingredients: Ingredient[] }>(
      restaurantPath(restaurantId, '/ingredients/seed/demo'),
      { method: 'POST' },
    ),

  listIngredients: (restaurantId: string) =>
    request<Ingredient[]>(restaurantPath(restaurantId, '/ingredients'), { query: { isActive: true } }),

  seedDemoInventoryBatches: (restaurantId: string) =>
    request<{ restaurantId: string; inventoryBatchesCreated: number; inventoryBatches: InventoryBatch[] }>(
      restaurantPath(restaurantId, '/inventory-batches/seed/demo'),
      { method: 'POST' },
    ),

  listInventoryBatches: (restaurantId: string) =>
    request<InventoryBatch[]>(restaurantPath(restaurantId, '/inventory-batches'), {
      query: { isActive: true },
    }),

  seedDemoRecipes: (restaurantId: string) =>
    request<{ restaurantId: string; recipesCreated: number; recipes: Recipe[] }>(
      restaurantPath(restaurantId, '/recipes/seed/demo'),
      { method: 'POST' },
    ),

  listRecipes: (restaurantId: string) =>
    request<Recipe[]>(restaurantPath(restaurantId, '/recipes'), { query: { isActive: true } }),

  consumeRecipeSale: (restaurantId: string, dto: CreateRecipeSaleConsumptionDto) =>
    request<RecipeSaleConsumptionResult>(restaurantPath(restaurantId, '/stock-consumptions/recipe-sale'), {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  listStockMovements: (restaurantId: string) =>
    request<StockMovement[]>(restaurantPath(restaurantId, '/stock-consumptions/movements')),

  createWasteEvent: (restaurantId: string, dto: CreateWasteEventDto) =>
    request<WasteEventResult>(restaurantPath(restaurantId, '/waste-events'), {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  listWasteEvents: (restaurantId: string) =>
    request<WasteEvent[]>(restaurantPath(restaurantId, '/waste-events')),

  generateRecommendations: (restaurantId: string, notes?: string) =>
    request<GenerateRecommendationsResult>(restaurantPath(restaurantId, '/recommendations/generate'), {
      method: 'POST',
      body: JSON.stringify(notes ? { notes } : {}),
    }),

  listRecommendations: (restaurantId: string) =>
    request<Recommendation[]>(restaurantPath(restaurantId, '/recommendations'), {
      query: { status: 'OPEN' },
    }),

  applyRecommendation: (restaurantId: string, recommendationId: string) =>
    request<Recommendation>(
      restaurantPath(restaurantId, `/recommendations/${encodeURIComponent(recommendationId)}/apply`),
      { method: 'PATCH' },
    ),

  dismissRecommendation: (restaurantId: string, recommendationId: string) =>
    request<Recommendation>(
      restaurantPath(restaurantId, `/recommendations/${encodeURIComponent(recommendationId)}/dismiss`),
      { method: 'PATCH' },
    ),

  runSimulation: (restaurantId: string, path: string, dto: RunSimulationDto) =>
    request<SimulationResult>(restaurantPath(restaurantId, path), {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
