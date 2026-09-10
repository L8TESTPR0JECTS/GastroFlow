import { Body, Controller, Param, Post } from '@nestjs/common';
import { RunSimulationDto } from './dto/run-simulation.dto';
import { SimulateFullDayDto } from './dto/simulate-full-day.dto';
import { SimulateLunchRushDto } from './dto/simulate-lunch-rush.dto';
import { SimulateOverbuyingDto } from './dto/simulate-overbuying.dto';
import { SimulateRecommendationActionsDto } from './dto/simulate-recommendation-actions.dto';
import { SimulateSupplierDeliveryDto } from './dto/simulate-supplier-delivery.dto';
import { SimulateTimeWindowDto } from './dto/simulate-time-window.dto';
import { SimulateWasteSpikeDto } from './dto/simulate-waste-spike.dto';
import { SimulateWeekDto } from './dto/simulate-week.dto';
import type { SimulationResult } from './models/simulation.model';
import { SimulationsService } from './simulations.service';

@Controller('restaurants/:restaurantId/simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('run')
  async runSimulation(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: RunSimulationDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, dto);
  }

  @Post('timeline/time-window')
  async simulateTimelineTimeWindow(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateTimeWindowDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'TIME_WINDOW'
    });
  }

  @Post('timeline/lunch-rush')
  async simulateTimelineLunchRush(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateLunchRushDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'LUNCH_RUSH',
      intensity: dto.intensity ?? 'BUSY'
    });
  }

  @Post('timeline/full-day')
  async simulateTimelineFullDay(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateFullDayDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'FULL_DAY'
    });
  }

  @Post('timeline/week')
  async simulateTimelineWeek(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateWeekDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'WEEK'
    });
  }

  @Post('scenario/supplier-delivery')
  async simulateSupplierDeliveryScenario(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateSupplierDeliveryDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'SUPPLIER_DELIVERY'
    });
  }

  @Post('scenario/waste-spike')
  async simulateWasteSpikeScenario(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateWasteSpikeDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'WASTE_SPIKE'
    });
  }

  @Post('scenario/overbuying')
  async simulateOverbuyingScenario(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateOverbuyingDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'OVERBUYING'
    });
  }

  @Post('scenario/follow-recommendations')
  async simulateFollowRecommendationsScenario(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateRecommendationActionsDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'FOLLOW_RECOMMENDATIONS'
    });
  }

  @Post('scenario/ignore-recommendations')
  async simulateIgnoreRecommendationsScenario(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SimulateRecommendationActionsDto
  ): Promise<SimulationResult> {
    return this.simulationsService.runSimulation(restaurantId, {
      ...dto,
      simulationType: 'IGNORE_RECOMMENDATIONS'
    });
  }
}
