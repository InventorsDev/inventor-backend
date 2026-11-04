import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LogInterceptor } from './shared/interceptors';
import { AllExceptionsFilter } from './shared/exceptions';
import { AuthModule } from './shared/auth/auth.module';
import { DataLogsModule } from './shared/datalogs';
import { UsersModule } from './users/users.module';
import { EventModule } from './events/events.users.module';
import { PostModule } from './blog/post/post.module';
import { FaqModule } from './faq/faq.module';
import { ScheduleModule } from '@nestjs/schedule';
import { V2Module } from './v2/v2.module';

// API versions are applied through URI versioning in main.ts: controllers
// default to v1, and v2 controllers declare `version: '2'` themselves.
@Module({
  imports: [
    AuthModule,
    UsersModule,
    EventModule,
    PostModule,
    FaqModule,
    V2Module,
    ThrottlerModule.forRoot([
      {
        ttl: +process.env.RATE_LIMIT_TTL,
        limit: +process.env.RATE_LIMIT_REQUEST_SIZE,
      },
    ]),
    ScheduleModule.forRoot(),
    DataLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    ThrottlerGuard,
    LogInterceptor,
    AllExceptionsFilter,
  ],
  exports: [AppService, Logger, LogInterceptor, AllExceptionsFilter],
})
export class AppModule {}
