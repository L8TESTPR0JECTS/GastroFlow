export interface AuditableModel {
  createdAt: string;
  updatedAt: string;
}

export interface IdentifiableModel {
  id: string;
}

export interface BaseModel extends IdentifiableModel, AuditableModel {}

export interface RestaurantScopedModel extends BaseModel {
  restaurantId: string;
}

export type IngredientCategory =
  | 'PROTEIN'
  | 'VEGETABLE'
  | 'DAIRY'
  | 'GRAIN'
  | 'BAKERY'
  | 'STARCH';

export type StorageType = 'REFRIGERATED' | 'FROZEN' | 'DRY' | 'ROOM_TEMPERATURE';
export type UnitOfMeasure = 'GRAM' | 'MILLILITER' | 'UNIT';
export type WasteRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type StockRotationStrategy = 'FIFO' | 'FEFO';

export interface Ingredient extends RestaurantScopedModel {
  name: string;
  nameKey: string;
  category: IngredientCategory;
  baseUnit: UnitOfMeasure;
  storageType: StorageType;
  averageShelfLifeDays: number;
  defaultCostPerUnit: number;
  wasteRiskLevel: WasteRiskLevel;
  recipeCoverageScore: number;
  stockRotationStrategy: StockRotationStrategy;
  lowStockThresholdQuantity: number;
  iconKey: string;
  description: string;
  isActive: boolean;
}

export type InventoryBatchStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_USED'
  | 'DEPLETED'
  | 'EXPIRED'
  | 'WASTED';

export interface InventoryBatch extends RestaurantScopedModel {
  ingredientId: string;
  ingredientName: string;
  locationId: string;
  quantityReceived: number;
  quantityAvailable: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
  receivedAt: string;
  expiresAt: string;
  status: InventoryBatchStatus;
  isActive: boolean;
  notes?: string;
}

export type RecipeCategory = 'PLATE' | 'BURGER' | 'SANDWICH' | 'TACO' | 'BOWL' | 'QUESADILLA';
export type RecipeStatus = 'ACTIVE' | 'INACTIVE';

export interface RecipeIngredientLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Recipe extends RestaurantScopedModel {
  name: string;
  nameKey: string;
  description: string;
  category: RecipeCategory;
  menuPrice: number;
  estimatedIngredientCost: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;
  ingredients: RecipeIngredientLine[];
  status: RecipeStatus;
  isActive: boolean;
}

export type WasteReason = 'EXPIRED' | 'SPOILED' | 'DAMAGED' | 'OVERPRODUCED' | 'MANUAL_DISCARD';

export interface WasteEvent extends RestaurantScopedModel {
  inventoryBatchId: string;
  ingredientId: string;
  ingredientName: string;
  quantityWasted: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
  reason: WasteReason;
  occurredAt: string;
  stockMovementId: string;
  notes?: string;
}

export type RecommendationType =
  | 'USE_SOON'
  | 'REDUCE_PURCHASE'
  | 'PROMOTE_RECIPE'
  | 'HIGH_MARGIN_OPPORTUNITY'
  | 'LOW_STOCK_RISK'
  | 'OVERSTOCK_RISK'
  | 'WASTE_PATTERN_DETECTED'
  | 'RECIPE_COST_WARNING'
  | 'MENU_PRICE_OPPORTUNITY'
  | 'BATCH_ROTATION_WARNING'
  | 'EXPIRATION_CLUSTER'
  | 'INVENTORY_IDLE';

export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendationStatus = 'OPEN' | 'DISMISSED' | 'APPLIED';

export interface Recommendation extends RestaurantScopedModel {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  status: RecommendationStatus;
  ingredientId?: string;
  ingredientName?: string;
  recipeId?: string;
  recipeName?: string;
  relatedRecipeIds: string[];
  relatedInventoryBatchIds: string[];
  reasonCode: string;
}

export type StockMovementType = 'CONSUMPTION' | 'ADJUSTMENT' | 'WASTE' | 'RECOUNT' | 'REVERSAL';
export type StockMovementSource = 'RECIPE_SALE' | 'SIMULATION' | 'MANUAL';

export interface StockMovement extends RestaurantScopedModel {
  inventoryBatchId: string;
  ingredientId: string;
  ingredientName: string;
  recipeId?: string;
  recipeName?: string;
  saleId?: string;
  quantitySold?: number;
  unitMenuPrice?: number;
  totalSalesRevenue?: number;
  inventoryCostConsumed?: number;
  estimatedGrossProfit?: number;
  estimatedGrossMarginPercentage?: number;
  movementType: StockMovementType;
  source: StockMovementSource;
  quantity: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
  occurredAt: string;
  notes?: string;
}

export interface RecipeSaleConsumptionIngredientSummary {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number;
  quantityConsumed: number;
  totalCost: number;
}

export interface RecipeSaleConsumptionResult {
  restaurantId: string;
  recipeId: string;
  recipeName: string;
  quantitySold: number;
  unitMenuPrice: number;
  totalSalesRevenue: number;
  inventoryCostConsumed: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;
  ingredients: RecipeSaleConsumptionIngredientSummary[];
  movements: StockMovement[];
}

export interface WasteEventResult {
  restaurantId: string;
  wasteEvent: WasteEvent;
  stockMovement: StockMovement;
  remainingQuantityAvailable: number;
  inventoryBatchStatus: string;
}

export interface GenerateRecommendationsResult {
  restaurantId: string;
  generatedCount: number;
  recommendations: Recommendation[];
}

export interface DashboardInventorySummary {
  totalInventoryValue: number;
  activeBatchCount: number;
  lowStockIngredientCount: number;
  expiringSoonBatchCount: number;
  expiredBatchCount: number;
  lowStockIngredients: DashboardLowStockIngredient[];
}

export interface DashboardLowStockIngredient {
  ingredientId: string;
  ingredientName: string;
  availableQuantity: number;
  lowStockThresholdQuantity: number;
  shortageQuantity: number;
  unit: string;
}

export interface DashboardWasteSummary {
  totalWasteCost: number;
  wasteEventCount: number;
  topWastedIngredients: DashboardTopWastedIngredient[];
}

export interface DashboardTopWastedIngredient {
  ingredientId: string;
  ingredientName: string;
  totalWasteCost: number;
  quantityWasted: number;
  eventCount: number;
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

export interface DashboardActivitySummary {
  recentStockMovements: DashboardRecentStockMovement[];
  recentWasteEvents: DashboardRecentWasteEvent[];
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

export type SimulationType =
  | 'TIME_WINDOW'
  | 'OPENING_TO_NOON'
  | 'LUNCH_RUSH'
  | 'AFTERNOON_SLOWDOWN'
  | 'DINNER_RUSH'
  | 'FULL_DAY'
  | 'MULTI_DAY'
  | 'WEEK'
  | 'SUPPLIER_DELIVERY'
  | 'WASTE_SPIKE'
  | 'OVERBUYING'
  | 'FOLLOW_RECOMMENDATIONS'
  | 'IGNORE_RECOMMENDATIONS';

export type SimulationIntensity = 'QUIET' | 'NORMAL' | 'BUSY' | 'CHAOS';
export type SimulationPeriod = 'OPENING' | 'MORNING_PREP' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'CLOSING';

export interface SimulationTimeframe {
  startsAt: string;
  endsAt: string;
  timezone: string;
}

export interface SimulationAction {
  type: string;
  description: string;
  occurredAt: string;
  entityId?: string;
  entityName?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface SimulationSummary {
  timelineEventCount: number;
  stockConsumptionCount: number;
  wasteEventCount: number;
  inventoryBatchCount: number;
  recommendationsAppliedCount: number;
  recommendationsDismissedCount: number;
  recommendationsGeneratedCount: number;
  quietPeriodCount: number;
  rushSpikeCount: number;
  totalEstimatedSales: number;
  totalWasteCost: number;
}

export interface SimulationTimelineEvent {
  id: string;
  eventType:
    | 'RECIPE_SALE'
    | 'SUPPLIER_DELIVERY'
    | 'WASTE_EVENT'
    | 'RECOMMENDATION_GENERATION'
    | 'RECOMMENDATION_APPLIED'
    | 'RECOMMENDATION_DISMISSED'
    | 'QUIET_PERIOD'
    | 'RUSH_SPIKE';
  scheduledAt: string;
  period: SimulationPeriod;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationResult {
  restaurantId: string;
  simulationType: SimulationType;
  intensity: SimulationIntensity;
  timeframe: SimulationTimeframe;
  seed?: string;
  startedAt: string;
  completedAt: string;
  timeline: SimulationTimelineEvent[];
  actions: SimulationAction[];
  summary: SimulationSummary;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantLocation extends RestaurantScopedModel {
  name: string;
  type: 'KITCHEN' | 'STORE' | 'WAREHOUSE';
  timezone: string;
  isDefault: boolean;
}

export interface SeedRestaurantResult {
  restaurant: Restaurant;
  location: RestaurantLocation;
}

export interface CreateRecipeSaleConsumptionDto {
  recipeId: string;
  quantitySold: number;
  notes?: string;
}

export interface CreateWasteEventDto {
  inventoryBatchId: string;
  quantityWasted: number;
  reason: WasteReason;
  notes?: string;
}

export interface RunSimulationDto {
  simulationType?: SimulationType;
  intensity?: SimulationIntensity;
  startsAt?: string;
  endsAt?: string;
  seed?: string;
  notes?: string;
  maxRecommendations?: number;
}
