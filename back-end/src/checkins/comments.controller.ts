import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';

@Controller('checkins/:checkInId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('checkInId') checkInId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.addComment(user.id, checkInId, dto.text);
  }

  @Get()
  list(@Param('checkInId') checkInId: string) {
    return this.comments.listComments(checkInId);
  }

  @Delete(':commentId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
  ) {
    return this.comments.deleteComment(user.id, commentId);
  }
}
