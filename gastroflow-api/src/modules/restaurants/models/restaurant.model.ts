import type { BaseModel } from '../../../common/models/base.model';

export type RestaurantStatus = 'ACTIVE' | 'INACTIVE';

export interface Restaurant extends BaseModel {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  status: RestaurantStatus;
}