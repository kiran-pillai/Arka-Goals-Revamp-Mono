import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  GoalType,
  MeasureType,
  FrequencyPeriod,
  GoalPeriodChoice,
} from '../../../generated/prisma/client';

export class CreateGoalDto {
  @IsEnum(['QUARTERLY'])
  type: GoalType;

  @IsEnum(['HABIT_PROCESS', 'OUTCOME'])
  measureType: MeasureType;

  @IsString()
  @MaxLength(500)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  // Creation never collects a target value, for either kind of goal. The field
  // is deliberately absent rather than optional: with the global
  // `forbidNonWhitelisted` validation pipe, a client that still sends
  // `targetValue` on create gets a 400 instead of having it silently dropped.
  // `Goal.targetValue` itself still exists for legacy rows and the update path.

  // HABIT_PROCESS goals only, and both are required there: "x times every
  // day/week/month/quarter".
  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyCount?: number;

  @IsOptional()
  @IsEnum(['DAY', 'WEEK', 'MONTH', 'QUARTER'])
  frequencyPeriod?: FrequencyPeriod;

  @IsOptional()
  @IsEnum(['QUARTERLY'])
  periodChoice?: GoalPeriodChoice;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
