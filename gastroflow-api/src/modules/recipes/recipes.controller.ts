import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';
import type { Recipe } from './models/recipe.model';

@Controller('restaurants/:restaurantId/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  async createRecipe(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.createRecipe(restaurantId, dto);
  }

  @Post('seed/demo')
  async seedDemoRecipes(
    @Param('restaurantId') restaurantId: string,
  ): Promise<{
    restaurantId: string;
    recipesCreated: number;
    recipes: Recipe[];
  }> {
    return this.recipesService.seedDemoRecipes(restaurantId);
  }

  @Get()
  async listRecipes(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListRecipesQueryDto,
  ): Promise<Recipe[]> {
    return this.recipesService.listRecipes(restaurantId, query);
  }

  @Get(':recipeId')
  async getRecipeById(
    @Param('restaurantId') restaurantId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<Recipe> {
    return this.recipesService.getRecipeById(restaurantId, recipeId);
  }

  @Patch(':recipeId')
  async updateRecipe(
    @Param('restaurantId') restaurantId: string,
    @Param('recipeId') recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.updateRecipe(restaurantId, recipeId, dto);
  }

  @Delete(':recipeId')
  async softDeleteRecipe(
    @Param('restaurantId') restaurantId: string,
    @Param('recipeId') recipeId: string,
  ): Promise<Recipe> {
    return this.recipesService.softDeleteRecipe(restaurantId, recipeId);
  }
}