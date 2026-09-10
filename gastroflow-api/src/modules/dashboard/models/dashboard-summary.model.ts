export interface DashboardMetricCard {
  label: string;
  value: number;
  unit?: string;
  helperText?: string;
}

export interface DashboardInventorySummary {
  totalInventoryValue: number;
  activeBatchCount: number;
  lowStockIngredientCount: number;
  expiringSoonBatchCount: number;
  expiredBatchCount: number;
  lowStockIngredients: DashboardLowStockIngredient[];
}

export interface DashboardWasteSummary {
  totalWasteCost: number;
  wasteEventCount: number;
  topWastedIngredients: DashboardTopWastedIngredient[];
}

export interface DashboardFinanceSummary {
  totalSalesRevenue: number;
  inventoryCostConsumed: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;
  recipeSaleCount: number;
  unitsSold: number;
  averageSaleValue: number;
}

export interface DashboardTopWastedIngredient {
  ingredientId: string;
  ingredientName: string;
  totalWasteCost: number;
  quantityWasted: number;
  eventCount: number;
}

export interface DashboardRecommendationSummary {
  openRecommendationCount: number;
  highPriorityRecommendationCount: number;
  recommendationsByType: DashboardRecommendationTypeSummary[];
}

export interface DashboardRecommendationTypeSummary {
  type: string;
  count: number;
}

export interface DashboardRecipeSummary {
  activeRecipeCount: number;
  highMarginRecipeCount: number;
  recipesToPromote: DashboardRecipeToPromote[];
}

export interface DashboardRecipeToPromote {
  recipeId: string;
  recipeName: string;
  estimatedGrossMarginPercentage: number;
  menuPrice: number;
}

export interface DashboardActivitySummary {
  recentStockMovements: DashboardRecentStockMovement[];
  recentWasteEvents: DashboardRecentWasteEvent[];
}

export interface DashboardRecentStockMovement {
  id: string;
  movementType: string;
  source: string;
  ingredientName: string;
  recipeName?: string;
  quantity: number;
  unit: string;
  totalCost: number;
  occurredAt: string;
}

export interface DashboardRecentWasteEvent {
  id: string;
  ingredientName: string;
  quantityWasted: number;
  unit: string;
  totalCost: number;
  reason: string;
  occurredAt: string;
}

export interface RestaurantDashboardSummary {
  restaurantId: string;
  generatedAt: string;
  generatedAtLocal: string;
  timezone: string;

  inventory: DashboardInventorySummary;
  finance: DashboardFinanceSummary;
  waste: DashboardWasteSummary;
  recommendations: DashboardRecommendationSummary;
  recipes: DashboardRecipeSummary;
  activity: DashboardActivitySummary;
}

export interface DashboardLowStockIngredient {
  ingredientId: string;
  ingredientName: string;
  availableQuantity: number;
  lowStockThresholdQuantity: number;
  shortageQuantity: number;
  unit: string;
}
