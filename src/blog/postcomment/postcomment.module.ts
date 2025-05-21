import { Module } from '@nestjs/common';
import { PostCommentService } from './postcomment.service';
import { PostCommentController } from './postcomment.controller';
import { DBModule } from 'src/shared/schema';

@Module({
  imports: [DBModule],
  controllers: [PostCommentController,],
  providers: [PostCommentService],
  exports: [PostCommentService],
})
export class PostCommentModule {}
