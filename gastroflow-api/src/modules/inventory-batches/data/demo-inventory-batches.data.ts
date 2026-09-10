export interface DemoInventoryBatchSeed {
  ingredientNameKey: string;
  locationId: string;
  quantityReceived: number;
  unitCost: number;
  shelfLifeDays: number;
  notes: string;
}

export const DEMO_INVENTORY_BATCHES: DemoInventoryBatchSeed[] = [
  {
    ingredientNameKey: 'steak',
    locationId: 'loc_demo_001',
    quantityReceived: 5000,
    unitCost: 0.018,
    shelfLifeDays: 5,
    notes: 'Demo steak delivery for plates, tacos, and burger-style recipes.',
  },
  {
    ingredientNameKey: 'chicken',
    locationId: 'loc_demo_001',
    quantityReceived: 6000,
    unitCost: 0.01,
    shelfLifeDays: 4,
    notes: 'Demo chicken delivery with higher waste risk and strong recipe coverage.',
  },
  {
    ingredientNameKey: 'potato',
    locationId: 'loc_demo_001',
    quantityReceived: 10000,
    unitCost: 0.003,
    shelfLifeDays: 14,
    notes: 'Demo potato stock for hearty side dishes and plates.',
  },
  {
    ingredientNameKey: 'bun',
    locationId: 'loc_demo_001',
    quantityReceived: 48,
    unitCost: 0.75,
    shelfLifeDays: 4,
    notes: 'Demo bun delivery for burgers and sandwiches.',
  },
  {
    ingredientNameKey: 'tomato',
    locationId: 'loc_demo_001',
    quantityReceived: 4000,
    unitCost: 0.004,
    shelfLifeDays: 5,
    notes: 'Demo tomato delivery for tacos, sandwiches, burgers, and bowls.',
  },
  {
    ingredientNameKey: 'lettuce',
    locationId: 'loc_demo_001',
    quantityReceived: 2500,
    unitCost: 0.005,
    shelfLifeDays: 3,
    notes: 'Demo lettuce delivery with short shelf life and high waste risk.',
  },
  {
    ingredientNameKey: 'cheese',
    locationId: 'loc_demo_001',
    quantityReceived: 3000,
    unitCost: 0.012,
    shelfLifeDays: 14,
    notes: 'Demo cheese stock for burgers, sandwiches, quesadillas, and loaded dishes.',
  },
  {
    ingredientNameKey: 'tortilla',
    locationId: 'loc_demo_001',
    quantityReceived: 80,
    unitCost: 0.35,
    shelfLifeDays: 10,
    notes: 'Demo tortilla stock for tacos and quesadillas.',
  },
  {
    ingredientNameKey: 'rice',
    locationId: 'loc_demo_001',
    quantityReceived: 15000,
    unitCost: 0.0025,
    shelfLifeDays: 180,
    notes: 'Demo rice stock as a stable dry ingredient for bowls.',
  },
  {
    ingredientNameKey: 'onion',
    locationId: 'loc_demo_001',
    quantityReceived: 5000,
    unitCost: 0.002,
    shelfLifeDays: 21,
    notes: 'Demo onion stock used broadly across plates, bowls, tacos, and burgers.',
  },
];