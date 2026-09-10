import type { RestaurantScopedModel } from '../../../common/models/base.model';

export type RestaurantLocationType = 'KITCHEN' | 'STORE' | 'WAREHOUSE';

export interface RestaurantLocation extends RestaurantScopedModel {
  name: string;
  type: RestaurantLocationType;
  timezone: string;
  isDefault: boolean;
}