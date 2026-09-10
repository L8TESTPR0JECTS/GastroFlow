import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import { ListRecommendationsQueryDto } from './dto/list-recommendations-query.dto';
import type { GenerateRecommendationsResult } from './models/generate-recommendations-result.model';
import type { Recommendation } from './models/recommendation.model';
import { RecommendationsService } from './recommendations.service';

@Controller('restaurants/:restaurantId/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('generate')
  async generateRecommendations(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: GenerateRecommendationsDto,
  ): Promise<GenerateRecommendationsResult> {
    return this.recommendationsService.generateRecommendations(
      restaurantId,
      dto,
    );
  }

  @Get()
  async listRecommendations(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListRecommendationsQueryDto,
  ): Promise<Recommendation[]> {
    return this.recommendationsService.listRecommendations(
      restaurantId,
      query,
    );
  }

  @Get(':recommendationId')
  async getRecommendationById(
    @Param('restaurantId') restaurantId: string,
    @Param('recommendationId') recommendationId: string,
  ): Promise<Recommendation> {
    return this.recommendationsService.getRecommendationById(
      restaurantId,
      recommendationId,
    );
  }

  @Patch(':recommendationId/apply')
  async applyRecommendation(
    @Param('restaurantId') restaurantId: string,
    @Param('recommendationId') recommendationId: string,
  ): Promise<Recommendation> {
    return this.recommendationsService.applyRecommendation(
      restaurantId,
      recommendationId,
    );
  }

  @Patch(':recommendationId/dismiss')
  async dismissRecommendation(
    @Param('restaurantId') restaurantId: string,
    @Param('recommendationId') recommendationId: string,
  ): Promise<Recommendation> {
    return this.recommendationsService.dismissRecommendation(
      restaurantId,
      recommendationId,
    );
  }
}
