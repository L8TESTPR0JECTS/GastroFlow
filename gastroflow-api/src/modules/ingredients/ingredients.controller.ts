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
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { ListIngredientsQueryDto } from './dto/list-ingredients-query.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientsService } from './ingredients.service';
import type { Ingredient } from './models/ingredient.model';

@Controller('restaurants/:restaurantId/ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  async createIngredient(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateIngredientDto,
  ): Promise<Ingredient> {
    return this.ingredientsService.createIngredient(restaurantId, dto);
  }

  @Post('seed/demo')
  async seedDemoIngredients(
    @Param('restaurantId') restaurantId: string,
  ): Promise<{
    restaurantId: string;
    ingredientsCreated: number;
    ingredients: Ingredient[];
  }> {
    return this.ingredientsService.seedDemoIngredients(restaurantId);
  }

  @Get()
  async listIngredients(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListIngredientsQueryDto,
  ): Promise<Ingredient[]> {
    return this.ingredientsService.listIngredients(restaurantId, query);
  }

  @Get(':ingredientId')
  async getIngredientById(
    @Param('restaurantId') restaurantId: string,
    @Param('ingredientId') ingredientId: string,
  ): Promise<Ingredient> {
    return this.ingredientsService.getIngredientById(
      restaurantId,
      ingredientId,
    );
  }

  @Patch(':ingredientId')
  async updateIngredient(
    @Param('restaurantId') restaurantId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    return this.ingredientsService.updateIngredient(
      restaurantId,
      ingredientId,
      dto,
    );
  }

  @Delete(':ingredientId')
  async softDeleteIngredient(
    @Param('restaurantId') restaurantId: string,
    @Param('ingredientId') ingredientId: string,
  ): Promise<Ingredient> {
    return this.ingredientsService.softDeleteIngredient(
      restaurantId,
      ingredientId,
    );
  }
}