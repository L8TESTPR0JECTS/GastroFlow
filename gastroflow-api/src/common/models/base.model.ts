export interface AuditableModel {
  createdAt: string;
  updatedAt: string;
}

export interface IdentifiableModel {
  id: string;
}

export interface BaseModel extends IdentifiableModel, AuditableModel {}

export interface RestaurantScopedModel extends BaseModel {
  restaurantId: string;
}