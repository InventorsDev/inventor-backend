import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { DBModule } from 'src/shared/schema';

@Module({
  imports: [DBModule],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
