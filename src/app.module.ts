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

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: +process.env.RATE_LIMIT_TTL,
        limit: +process.env.RATE_LIMIT_REQUEST_SIZE,
      },
    ]),
    DataLogsModule,
    UsersModule,
    EventModule,
    PostModule,
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
