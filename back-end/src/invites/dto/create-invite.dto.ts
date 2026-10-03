import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import type { Role } from '../../../generated/prisma/client';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  /** Role granted when the invite is redeemed. Defaults to MEMBER. */
  @IsOptional()
  @IsIn(['MEMBER', 'ADMIN'])
  role?: Role;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
