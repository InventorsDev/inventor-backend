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
// import { NodeMailService } from './node-mail/node-mail.service';
// import { NodeMailModule } from './node-mail/node-mail.module';

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
    // NodeMailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    ThrottlerGuard,
    LogInterceptor,
    AllExceptionsFilter,
    // NodeMailService,
  ],
  exports: [AppService, Logger, LogInterceptor, AllExceptionsFilter],
})
export class AppModule {}
