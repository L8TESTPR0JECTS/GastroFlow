export interface RestaurantSalesSummary {
  restaurantId: string;

  totalQuantitySold: number;
  totalSalesRevenue: number;
  totalInventoryCostConsumed: number;
  totalGrossProfit: number;

  processedStockConsumedEvents: number;

  createdAt: string;
  updatedAt: string;
}