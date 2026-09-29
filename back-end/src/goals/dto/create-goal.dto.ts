import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  GoalType,
  MeasureType,
  GoalPeriodChoice,
} from '../../../generated/prisma/client';

export class CreateGoalDto {
  @IsEnum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'GIVE_UP'])
  type: GoalType;

  @IsEnum(['ACTION_BASED', 'PASS_FAIL'])
  measureType: MeasureType;

  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetValue?: number;

  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY'])
  periodChoice?: GoalPeriodChoice;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
