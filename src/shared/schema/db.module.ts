import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configs } from '../configs';
import { ConnectionProviders, SchemaProviders } from './index';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
    }),
  ],
  providers: [...ConnectionProviders, ...SchemaProviders],
  exports: [...ConnectionProviders, ...SchemaProviders, ConfigModule],
})
export class DBModule {}
