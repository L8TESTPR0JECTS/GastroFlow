import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import { Restaurant } from '../models/restaurant.model';
import { RestaurantLocation } from '../models/restaurant-location.model';
import { RestaurantMember } from '../models/restaurant-member.model';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class RestaurantsRepository {
  private readonly restaurantsCollection = 'restaurants';
  private readonly locationsCollection = 'restaurantLocations';
  private readonly membersCollection = 'restaurantMembers';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) { }

  async createRestaurant(restaurant: Restaurant): Promise<Restaurant> {
    await this.firestore
      .collection(this.restaurantsCollection)
      .doc(restaurant.id)
      .set(restaurant);

    return restaurant;
  }

  async findRestaurantById(restaurantId: string): Promise<Restaurant> {
    const snapshot = await this.firestore
      .collection(this.restaurantsCollection)
      .doc(restaurantId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Restaurant ${restaurantId} was not found.`);
    }

    return snapshot.data() as Restaurant;
  }

  async updateRestaurant(
    restaurantId: string,
    changes: Partial<Restaurant>,
  ): Promise<Restaurant> {
    const ref = this.firestore.collection(this.restaurantsCollection).doc(restaurantId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Restaurant ${restaurantId} was not found.`);
    }

    await ref.update(changes);

    const updatedSnapshot = await ref.get();
    return updatedSnapshot.data() as Restaurant;
  }

  async createLocation(location: RestaurantLocation): Promise<RestaurantLocation> {
    await this.firestore
      .collection(this.locationsCollection)
      .doc(location.id)
      .set(location);

    return location;
  }

  async findLocationsByRestaurantId(restaurantId: string): Promise<RestaurantLocation[]> {
    const snapshot = await this.firestore
      .collection(this.locationsCollection)
      .where('restaurantId', '==', restaurantId)
      .get();

    return snapshot.docs.map((doc) => doc.data() as RestaurantLocation);
  }

  async findDefaultLocation(restaurantId: string): Promise<RestaurantLocation> {
    const snapshot = await this.firestore
      .collection(this.locationsCollection)
      .where('restaurantId', '==', restaurantId)
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException(`Default location for restaurant ${restaurantId} was not found.`);
    }

    return snapshot.docs[0].data() as RestaurantLocation;
  }

  async createMember(member: RestaurantMember): Promise<RestaurantMember> {
    await this.firestore
      .collection(this.membersCollection)
      .doc(member.id)
      .set(member);

    return member;
  }

  async findMembersByRestaurantId(restaurantId: string): Promise<RestaurantMember[]> {
    const snapshot = await this.firestore
      .collection(this.membersCollection)
      .where('restaurantId', '==', restaurantId)
      .get();

    return snapshot.docs.map((doc) => doc.data() as RestaurantMember);
  }

  async findLocationById(
    restaurantId: string,
    locationId: string,
  ): Promise<RestaurantLocation> {
    const snapshot = await this.firestore
      .collection(this.locationsCollection)
      .doc(locationId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Location ${locationId} was not found.`);
    }

    const location = snapshot.data() as RestaurantLocation;

    if (location.restaurantId !== restaurantId) {
      throw new NotFoundException(`Location ${locationId} was not found.`);
    }

    return location;
  }
}