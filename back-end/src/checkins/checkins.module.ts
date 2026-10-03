import { Module } from '@nestjs/common';
import { CheckInsController } from './checkins.controller';
import { CheckInsService } from './checkins.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CheckInsController, CommentsController],
  providers: [CheckInsService, CommentsService],
})
export class CheckInsModule {}
