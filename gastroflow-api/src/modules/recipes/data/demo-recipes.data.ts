import type { RecipeCategory } from '../models/recipe.model';

export interface DemoRecipeIngredientSeed {
  ingredientNameKey: string;
  quantity: number;
}

export interface DemoRecipeSeed {
  name: string;
  description: string;
  category: RecipeCategory;
  menuPrice: number;
  ingredients: DemoRecipeIngredientSeed[];
}

export const DEMO_RECIPES: DemoRecipeSeed[] = [
  {
    name: 'Steak Plate',
    description:
      'A hearty steak plate served with potatoes and onions.',
    category: 'PLATE',
    menuPrice: 18.99,
    ingredients: [
      {
        ingredientNameKey: 'steak',
        quantity: 220,
      },
      {
        ingredientNameKey: 'potato',
        quantity: 250,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 40,
      },
    ],
  },
  {
    name: 'Chicken Plate',
    description:
      'A balanced chicken plate with potatoes and onions.',
    category: 'PLATE',
    menuPrice: 15.99,
    ingredients: [
      {
        ingredientNameKey: 'chicken',
        quantity: 220,
      },
      {
        ingredientNameKey: 'potato',
        quantity: 250,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 40,
      },
    ],
  },
  {
    name: 'Cheeseburger',
    description:
      'A classic cheeseburger with steak-style protein, cheese, lettuce, tomato, onion, and a bun.',
    category: 'BURGER',
    menuPrice: 14.99,
    ingredients: [
      {
        ingredientNameKey: 'steak',
        quantity: 180,
      },
      {
        ingredientNameKey: 'bun',
        quantity: 1,
      },
      {
        ingredientNameKey: 'cheese',
        quantity: 35,
      },
      {
        ingredientNameKey: 'lettuce',
        quantity: 25,
      },
      {
        ingredientNameKey: 'tomato',
        quantity: 40,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 20,
      },
    ],
  },
  {
    name: 'Chicken Sandwich',
    description:
      'A chicken sandwich with cheese, lettuce, tomato, onion, and a bun.',
    category: 'SANDWICH',
    menuPrice: 13.99,
    ingredients: [
      {
        ingredientNameKey: 'chicken',
        quantity: 180,
      },
      {
        ingredientNameKey: 'bun',
        quantity: 1,
      },
      {
        ingredientNameKey: 'cheese',
        quantity: 30,
      },
      {
        ingredientNameKey: 'lettuce',
        quantity: 25,
      },
      {
        ingredientNameKey: 'tomato',
        quantity: 40,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 20,
      },
    ],
  },
  {
    name: 'Steak Tacos',
    description:
      'Two steak tacos with tomato, lettuce, and onion.',
    category: 'TACO',
    menuPrice: 12.99,
    ingredients: [
      {
        ingredientNameKey: 'steak',
        quantity: 160,
      },
      {
        ingredientNameKey: 'tortilla',
        quantity: 2,
      },
      {
        ingredientNameKey: 'tomato',
        quantity: 50,
      },
      {
        ingredientNameKey: 'lettuce',
        quantity: 35,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 25,
      },
    ],
  },
  {
    name: 'Chicken Tacos',
    description:
      'Two chicken tacos with tomato, lettuce, and onion.',
    category: 'TACO',
    menuPrice: 11.99,
    ingredients: [
      {
        ingredientNameKey: 'chicken',
        quantity: 160,
      },
      {
        ingredientNameKey: 'tortilla',
        quantity: 2,
      },
      {
        ingredientNameKey: 'tomato',
        quantity: 50,
      },
      {
        ingredientNameKey: 'lettuce',
        quantity: 35,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 25,
      },
    ],
  },
  {
    name: 'Cheese Quesadilla',
    description:
      'A simple cheese quesadilla with tortilla, cheese, and onions.',
    category: 'QUESADILLA',
    menuPrice: 9.99,
    ingredients: [
      {
        ingredientNameKey: 'tortilla',
        quantity: 2,
      },
      {
        ingredientNameKey: 'cheese',
        quantity: 90,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 20,
      },
    ],
  },
  {
    name: 'Chicken Rice Bowl',
    description:
      'A chicken rice bowl with tomato, lettuce, and onion.',
    category: 'BOWL',
    menuPrice: 13.49,
    ingredients: [
      {
        ingredientNameKey: 'chicken',
        quantity: 180,
      },
      {
        ingredientNameKey: 'rice',
        quantity: 250,
      },
      {
        ingredientNameKey: 'tomato',
        quantity: 50,
      },
      {
        ingredientNameKey: 'lettuce',
        quantity: 35,
      },
      {
        ingredientNameKey: 'onion',
        quantity: 25,
      },
    ],
  },
];