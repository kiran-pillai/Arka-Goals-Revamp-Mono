import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
export class CheckInsController {
  constructor(private readonly checkIns: CheckInsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckInDto) {
    return this.checkIns.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('mine') mine?: string) {
    if (mine !== undefined && mine !== 'true' && mine !== 'false') {
      throw new BadRequestException('incorrect param for mine');
    }
    return this.checkIns.list(user.id, mine !== 'false');
  }
}
