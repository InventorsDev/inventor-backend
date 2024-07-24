import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataLog, DataLogSchema } from './data.log.schema';
import { configs } from '../configs';
import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { Module } from '@nestjs/common';
import { User, UserSchema } from './user.schema';
import { EventSchema } from './events.schema';

// All Schema Models
export * from './data.log.schema';
export * from './user.schema';
export * from './events.schema';

const SCHEMA_LIST = [
  { name: User.name, schema: UserSchema, dbPrefix: 'APP' },
  { name: Event.name, schema: EventSchema, dbPrefix: 'APP' },
  { name: DataLog.name, schema: DataLogSchema, dbPrefix: 'LOG' },
];

export const CONNECTION = SCHEMA_LIST.reduce((result, data) => {
  result[data.name] = `${data.name}Connection`;
  return result;
}, {} as any);

export const ConnectionProviders = SCHEMA_LIST.map((model) => ({
  provide: `${model.name}Connection`,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const dbUriKey = process.env.Test
      ? 'TEST_DATABASE_URL'
      : `${model.dbPrefix.toUpperCase()}_DATABASE_URL`;
    const deConfigOps = { autoIndex: false };
    const configOps: ConnectOptions = config.get('dbConfig') || deConfigOps;
    return createConnection(config.get(dbUriKey), configOps);
  },
}));

export const SchemaProviders = SCHEMA_LIST.map((model) => ({
  provide: model.name,
  useFactory: (connection: Connection & any) =>
    connection.model(model.name, model.schema),
  inject: [`${model.name}Connection`],
}));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
    }),
  ],
  providers: [...ConnectionProviders, ...SchemaProviders],
  exports: [...ConnectionProviders, ...SchemaProviders, ConfigModule],
} as any)
export class DBModule {}
