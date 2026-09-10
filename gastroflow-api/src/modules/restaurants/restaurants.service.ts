import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createSlug } from '../../common/utils/slug.util';
import {
  getDefaultTimeZone,
  nowIso,
  resolveTimeZone
} from '../../common/utils/date.util';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Restaurant } from './models/restaurant.model';
import { RestaurantLocation } from './models/restaurant-location.model';
import { RestaurantMember } from './models/restaurant-member.model';
import { RestaurantsRepository } from './repositories/restaurants.repository';
import { createAuditTimestamps } from 'src/common/utils/audit.util';
import { audit } from 'rxjs';

@Injectable()
export class RestaurantsService {
  constructor(private readonly restaurantsRepository: RestaurantsRepository) { }

  async createRestaurant(dto: CreateRestaurantDto): Promise<Restaurant> {

    const audit = createAuditTimestamps();

    const restaurant: Restaurant = {
      id: `rest_${randomUUID()}`,
      name: dto.name.trim(),
      slug: createSlug(dto.name),
      timezone: resolveTimeZone(dto.timezone ?? getDefaultTimeZone()),
      currency: dto.currency ?? 'USD',
      status: 'ACTIVE',
      ...audit
    };

    await this.restaurantsRepository.createRestaurant(restaurant);

    await this.createLocation(restaurant.id, {
      name: 'Main Kitchen',
      type: 'KITCHEN',
      timezone: restaurant.timezone,
      isDefault: true,
    });

    await this.createMember(restaurant.id, {
      userId: 'user_demo_owner',
      email: dto.ownerEmail ?? 'demo@gastroflow.app',
      displayName: dto.ownerDisplayName ?? 'Demo Owner',
      role: 'OWNER',
    });

    return restaurant;
  }

  async getRestaurantById(restaurantId: string): Promise<Restaurant> {
    return this.restaurantsRepository.findRestaurantById(restaurantId);
  }

  async updateRestaurant(
    restaurantId: string,
    dto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const changes: Partial<Restaurant> = {
      ...dto,
      updatedAt: nowIso(),
    };

    if (dto.timezone !== undefined) {
      changes.timezone = resolveTimeZone(dto.timezone);
    }

    if (dto.name) {
      changes.name = dto.name.trim();
      changes.slug = createSlug(dto.name);
    }

    return this.restaurantsRepository.updateRestaurant(restaurantId, changes);
  }

  async createLocation(
    restaurantId: string,
    dto: CreateLocationDto,
  ): Promise<RestaurantLocation> {
    await this.restaurantsRepository.findRestaurantById(restaurantId);

    const audit = createAuditTimestamps();

    const location: RestaurantLocation = {
      id: `loc_${randomUUID()}`,
      restaurantId,
      name: dto.name.trim(),
      type: dto.type ?? 'KITCHEN',
      timezone: resolveTimeZone(dto.timezone ?? getDefaultTimeZone()),
      isDefault: dto.isDefault ?? false,
      ...audit
    };

    return this.restaurantsRepository.createLocation(location);
  }

  async getLocations(restaurantId: string): Promise<RestaurantLocation[]> {
    await this.restaurantsRepository.findRestaurantById(restaurantId);
    return this.restaurantsRepository.findLocationsByRestaurantId(restaurantId);
  }

  async getDefaultLocation(restaurantId: string): Promise<RestaurantLocation> {
    await this.restaurantsRepository.findRestaurantById(restaurantId);
    return this.restaurantsRepository.findDefaultLocation(restaurantId);
  }

  async createMember(
    restaurantId: string,
    dto: CreateMemberDto,
  ): Promise<RestaurantMember> {
    await this.restaurantsRepository.findRestaurantById(restaurantId);

    const audit = createAuditTimestamps();

    const member: RestaurantMember = {
      id: `member_${randomUUID()}`,
      restaurantId,
      userId: dto.userId,
      email: dto.email.toLowerCase(),
      displayName: dto.displayName.trim(),
      role: dto.role,
      status: 'ACTIVE',
      ...audit
    };

    return this.restaurantsRepository.createMember(member);
  }

  async getMembers(restaurantId: string): Promise<RestaurantMember[]> {
    await this.restaurantsRepository.findRestaurantById(restaurantId);
    return this.restaurantsRepository.findMembersByRestaurantId(restaurantId);
  }

  async seedDemoRestaurant(): Promise<{
    restaurant: Restaurant;
    location: RestaurantLocation;
    members: RestaurantMember[];
  }> {
    const audit = createAuditTimestamps();

    const restaurant: Restaurant = {
      id: 'rest_demo_001',
      name: 'GastroFlow Demo Kitchen',
      slug: 'gastroflow-demo-kitchen',
      timezone: getDefaultTimeZone(),
      currency: 'USD',
      status: 'ACTIVE',
      ...audit
    };

    await this.restaurantsRepository.createRestaurant(restaurant);

    const location: RestaurantLocation = {
      id: 'loc_demo_001',
      restaurantId: restaurant.id,
      name: 'Main Demo Kitchen',
      type: 'KITCHEN',
      timezone: restaurant.timezone,
      isDefault: true,
      ...audit
    };

    await this.restaurantsRepository.createLocation(location);

    const owner: RestaurantMember = {
      id: 'member_demo_owner',
      restaurantId: restaurant.id,
      userId: 'user_demo_owner',
      email: 'demo@gastroflow.app',
      displayName: 'Demo Owner',
      role: 'OWNER',
      status: 'ACTIVE',
      ...audit
    };

    await this.restaurantsRepository.createMember(owner);

    return {
      restaurant,
      location,
      members: [owner],
    };
  }

  async getLocationById(
    restaurantId: string,
    locationId: string,
  ): Promise<RestaurantLocation> {
    return this.restaurantsRepository.findLocationById(
      restaurantId,
      locationId,
    );
  }
}
