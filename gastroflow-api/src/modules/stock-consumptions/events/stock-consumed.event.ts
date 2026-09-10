export interface StockConsumedEventIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityConsumed: number;
  totalCost: number;
}

export interface StockConsumedEventMovement {
  movementId: string;
  inventoryBatchId: string;
  ingredientId: string;
  quantity: number;
  totalCost: number;
}

export interface StockConsumedEventPayload {
  recipeId: string;
  recipeName: string;
  quantitySold: number;

  unitMenuPrice: number;
  totalSalesRevenue: number;
  inventoryCostConsumed: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;

  ingredients: StockConsumedEventIngredient[];
  movements: StockConsumedEventMovement[];
}

export interface StockConsumedEvent {
  eventType: 'StockConsumed';
  eventId: string;
  restaurantId: string;

  recipeId: string;
  recipeName: string;
  quantitySold: number;

  unitMenuPrice: number;
  totalSalesRevenue: number;
  inventoryCostConsumed: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;

  ingredients: StockConsumedEventIngredient[];
  movements: StockConsumedEventMovement[];

  occurredAt: string;
}
