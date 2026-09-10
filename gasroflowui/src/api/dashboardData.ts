import { gastroflowApi } from './gastroflowApi';
import type {
  Ingredient,
  InventoryBatch,
  Recipe,
  Recommendation,
  RestaurantDashboardSummary,
  StockMovement,
  WasteEvent,
} from './types';

export interface DashboardData {
  summary: RestaurantDashboardSummary;
  ingredients: Ingredient[];
  inventoryBatches: InventoryBatch[];
  recipes: Recipe[];
  wasteEvents: WasteEvent[];
  recommendations: Recommendation[];
  stockMovements: StockMovement[];
}

export async function loadDashboardData(restaurantId: string): Promise<DashboardData> {
  const [summary, ingredients, inventoryBatches, recipes, wasteEvents, recommendations, stockMovements] =
    await Promise.all([
      gastroflowApi.getDashboardSummary(restaurantId),
      gastroflowApi.listIngredients(restaurantId),
      gastroflowApi.listInventoryBatches(restaurantId),
      gastroflowApi.listRecipes(restaurantId),
      gastroflowApi.listWasteEvents(restaurantId),
      gastroflowApi.listRecommendations(restaurantId),
      gastroflowApi.listStockMovements(restaurantId),
    ]);

  return {
    summary,
    ingredients,
    inventoryBatches,
    recipes,
    wasteEvents,
    recommendations,
    stockMovements,
  };
}
