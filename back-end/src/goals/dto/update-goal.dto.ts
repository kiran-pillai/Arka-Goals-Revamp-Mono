import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { GoalStatus } from '../../../generated/prisma/client';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentValue?: number;

  @IsOptional()
  @IsEnum(['ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED'])
  status?: GoalStatus;
}
