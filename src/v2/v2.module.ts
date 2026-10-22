import { Module } from '@nestjs/common';
import { V2Controller } from './v2.controller';

@Module({
  imports: [],
  controllers: [V2Controller],
  providers: [],
  exports: [],
})
export class V2Module {}
