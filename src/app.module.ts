import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LogInterceptor } from './shared/interceptors';
import { AllExceptionsFilter } from './shared/exceptions';
import { AuthModule } from './shared/auth/auth.module';
import { DataLogsModule } from './shared/datalogs';
import { UsersModule } from './users/users.module';
import { LeadRegistrationController } from './lead_registration/lead_registration.controller';
import { LeadRegistrationModule } from './lead_registration/lead_registration.module';
import { User } from './shared/schema';
import { EventModule } from './events/events.users.module';

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
    LeadRegistrationModule,
    EventModule,
  ],
  controllers: [AppController, LeadRegistrationController],
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
