import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { CelebrationsService } from './celebrations.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class CelebrationsController {
  constructor(private readonly celebrations: CelebrationsService) {}
  @Get('celebrations/dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.celebrations.dashboard(user.id);
  }
  @Get('celebrations/leaderboard')
  leaderboard() {
    return this.celebrations.leaderboard();
  }
  @Get('checkins/:id/kudos')
  recipients(@Param('id', ParseUUIDPipe) id: string) {
    return this.celebrations.recipients(id);
  }
  @Post('checkins/:id/kudos')
  give(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.celebrations.give(user.id, id);
  }
}
