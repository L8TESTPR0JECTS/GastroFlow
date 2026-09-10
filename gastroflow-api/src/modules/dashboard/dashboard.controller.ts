import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import type { RestaurantDashboardSummary } from './models/dashboard-summary.model';
import { DashboardService } from './dashboard.service';

@Controller('restaurants/:restaurantId/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getDashboardSummary(
    @Param('restaurantId') restaurantId: string,
    @Query() query: GetDashboardQueryDto
  ): Promise<RestaurantDashboardSummary> {
    return this.dashboardService.getDashboardSummary(restaurantId, query);
  }
}