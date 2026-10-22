import { CelebrationsController } from './celebrations.controller';
import { CelebrationsService } from './celebrations.service';
import { Module } from '@nestjs/common';
import { CheckInsController } from './checkins.controller';
import { CheckInsService } from './checkins.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CelebrationsController, CheckInsController, CommentsController],
  providers: [CelebrationsService, CheckInsService, CommentsService],
})
export class CheckInsModule {}
