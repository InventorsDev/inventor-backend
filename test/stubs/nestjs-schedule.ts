// @nestjs/schedule v12 ships as ES modules only, which Jest cannot load
// without experimental ESM support. Cron jobs should not run during e2e tests
// anyway, so the e2e config maps the package to this no-op stand-in.
import { Module } from '@nestjs/common';

@Module({})
export class ScheduleModule {
  static forRoot() {
    return { module: ScheduleModule };
  }
}

export const Cron = (): MethodDecorator => () => undefined;

export const CronExpression = new Proxy({} as Record<string, string>, {
  get: (_target, name) => String(name),
});
