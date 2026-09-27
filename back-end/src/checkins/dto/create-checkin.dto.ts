import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class CreateCheckInDto {
  @IsBoolean()
  completedGoal: boolean;

  @IsString()
  @MaxLength(5000)
  results: string;

  @IsString()
  @MaxLength(5000)
  commitments: string;

  @IsString()
  @MaxLength(5000)
  wins: string;

  @IsString()
  @MaxLength(5000)
  frictions: string;
}
