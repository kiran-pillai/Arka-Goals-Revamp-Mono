import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';

@Controller('invites')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post()
  create(@Body() dto: CreateInviteDto, @CurrentUser() admin: AuthUser) {
    return this.invites.create(dto, admin.id);
  }

  @Get()
  list() {
    return this.invites.list();
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.invites.revoke(id);
  }
}
