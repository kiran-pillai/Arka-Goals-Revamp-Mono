import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  mentionedUserIds?: string[];
}
