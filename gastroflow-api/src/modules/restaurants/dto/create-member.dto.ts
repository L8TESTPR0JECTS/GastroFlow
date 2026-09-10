import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { RestaurantRole } from '../models/restaurant-member.model';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsIn(['OWNER', 'MANAGER', 'STAFF'])
  role!: RestaurantRole;
}