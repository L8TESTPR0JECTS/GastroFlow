import type { RestaurantScopedModel } from '../../../common/models/base.model';

export type RestaurantRole = 'OWNER' | 'MANAGER' | 'STAFF';
export type RestaurantMemberStatus = 'ACTIVE' | 'INACTIVE';

export interface RestaurantMember extends RestaurantScopedModel {
  userId: string;
  email: string;
  displayName: string;
  role: RestaurantRole;
  status: RestaurantMemberStatus;
}