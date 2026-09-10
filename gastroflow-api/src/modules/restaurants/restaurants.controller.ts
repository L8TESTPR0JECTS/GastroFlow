import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  createRestaurant(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.createRestaurant(dto);
  }

  @Post('seed/demo')
  seedDemoRestaurant() {
    return this.restaurantsService.seedDemoRestaurant();
  }

  @Get(':restaurantId')
  getRestaurantById(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getRestaurantById(restaurantId);
  }

  @Patch(':restaurantId')
  updateRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateRestaurant(restaurantId, dto);
  }

  @Post(':restaurantId/locations')
  createLocation(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.restaurantsService.createLocation(restaurantId, dto);
  }

  @Get(':restaurantId/locations')
  getLocations(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getLocations(restaurantId);
  }

  @Get(':restaurantId/locations/default')
  getDefaultLocation(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getDefaultLocation(restaurantId);
  }

  @Post(':restaurantId/members')
  createMember(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.restaurantsService.createMember(restaurantId, dto);
  }

  @Get(':restaurantId/members')
  getMembers(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.getMembers(restaurantId);
  }
}