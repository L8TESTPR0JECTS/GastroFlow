import type { Ingredient } from '../models/ingredient.model';

export type DemoIngredientSeed = Omit<
  Ingredient,
  'id' | 'restaurantId' | 'nameKey' | 'createdAt' | 'updatedAt'
>;

export const DEMO_INGREDIENTS: DemoIngredientSeed[] = [
  {
    name: 'Steak',
    category: 'PROTEIN',
    baseUnit: 'GRAM',
    storageType: 'REFRIGERATED',
    averageShelfLifeDays: 5,
    defaultCostPerUnit: 0.018,
    wasteRiskLevel: 'MEDIUM',
    recipeCoverageScore: 4,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 1500,
    targetStockQuantity: 6000,
    iconKey: 'steak',
    description:
      'A premium protein used for steak plates, tacos, rice bowls, or ground-style burger recipes.',
    isActive: true
  },
  {
    name: 'Chicken',
    category: 'PROTEIN',
    baseUnit: 'GRAM',
    storageType: 'REFRIGERATED',
    averageShelfLifeDays: 4,
    defaultCostPerUnit: 0.01,
    wasteRiskLevel: 'HIGH',
    recipeCoverageScore: 4,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 1800,
    targetStockQuantity: 7000,
    iconKey: 'chicken',
    description:
      'A versatile protein used for plates, sandwiches, tacos, and rice bowls.',
    isActive: true
  },
  {
    name: 'Potato',
    category: 'STARCH',
    baseUnit: 'GRAM',
    storageType: 'ROOM_TEMPERATURE',
    averageShelfLifeDays: 14,
    defaultCostPerUnit: 0.003,
    wasteRiskLevel: 'LOW',
    recipeCoverageScore: 2,
    stockRotationStrategy: 'FIFO',
    lowStockThresholdQuantity: 3000,
    targetStockQuantity: 12000,
    iconKey: 'potato',
    description:
      'A hearty starch used for side dishes, plates, and future fries-based recipes.',
    isActive: true
  },
  {
    name: 'Bun',
    category: 'BAKERY',
    baseUnit: 'UNIT',
    storageType: 'ROOM_TEMPERATURE',
    averageShelfLifeDays: 4,
    defaultCostPerUnit: 0.75,
    wasteRiskLevel: 'MEDIUM',
    recipeCoverageScore: 2,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 12,
    targetStockQuantity: 48,
    iconKey: 'bun',
    description:
      'A bakery item used to unlock burgers and sandwich-style menu items.',
    isActive: true
  },
  {
    name: 'Tomato',
    category: 'VEGETABLE',
    baseUnit: 'GRAM',
    storageType: 'ROOM_TEMPERATURE',
    averageShelfLifeDays: 5,
    defaultCostPerUnit: 0.004,
    wasteRiskLevel: 'MEDIUM',
    recipeCoverageScore: 5,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 1000,
    targetStockQuantity: 4000,
    iconKey: 'tomato',
    description:
      'A fresh vegetable used across burgers, sandwiches, tacos, and rice bowls.',
    isActive: true
  },
  {
    name: 'Lettuce',
    category: 'VEGETABLE',
    baseUnit: 'GRAM',
    storageType: 'REFRIGERATED',
    averageShelfLifeDays: 3,
    defaultCostPerUnit: 0.005,
    wasteRiskLevel: 'HIGH',
    recipeCoverageScore: 5,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 700,
    targetStockQuantity: 2500,
    iconKey: 'lettuce',
    description:
      'A high-risk fresh vegetable with short shelf life but strong recipe coverage.',
    isActive: true
  },
  {
    name: 'Cheese',
    category: 'DAIRY',
    baseUnit: 'GRAM',
    storageType: 'REFRIGERATED',
    averageShelfLifeDays: 14,
    defaultCostPerUnit: 0.012,
    wasteRiskLevel: 'LOW',
    recipeCoverageScore: 3,
    stockRotationStrategy: 'FEFO',
    lowStockThresholdQuantity: 800,
    targetStockQuantity: 4000,
    iconKey: 'cheese',
    description:
      'A dairy ingredient used for cheeseburgers, sandwiches, quesadillas, and loaded dishes.',
    isActive: true
  },
  {
    name: 'Tortilla',
    category: 'GRAIN',
    baseUnit: 'UNIT',
    storageType: 'ROOM_TEMPERATURE',
    averageShelfLifeDays: 10,
    defaultCostPerUnit: 0.35,
    wasteRiskLevel: 'LOW',
    recipeCoverageScore: 3,
    stockRotationStrategy: 'FIFO',
    lowStockThresholdQuantity: 20,
    targetStockQuantity: 80,
    iconKey: 'tortilla',
    description: 'A grain-based item used for tacos and quesadillas.',
    isActive: true
  },
  {
    name: 'Rice',
    category: 'GRAIN',
    baseUnit: 'GRAM',
    storageType: 'DRY',
    averageShelfLifeDays: 180,
    defaultCostPerUnit: 0.0025,
    wasteRiskLevel: 'LOW',
    recipeCoverageScore: 2,
    stockRotationStrategy: 'FIFO',
    lowStockThresholdQuantity: 4000,
    targetStockQuantity: 20000,
    iconKey: 'rice',
    description:
      'A long-lasting dry ingredient used as a base for rice bowls and stable menu planning.',
    isActive: true
  },
  {
    name: 'Onion',
    category: 'VEGETABLE',
    baseUnit: 'GRAM',
    storageType: 'ROOM_TEMPERATURE',
    averageShelfLifeDays: 21,
    defaultCostPerUnit: 0.002,
    wasteRiskLevel: 'LOW',
    recipeCoverageScore: 6,
    stockRotationStrategy: 'FIFO',
    lowStockThresholdQuantity: 1200,
    targetStockQuantity: 6000,
    iconKey: 'onion',
    description:
      'A flexible vegetable used across plates, tacos, bowls, burgers, and quesadillas.',
    isActive: true
  }
];