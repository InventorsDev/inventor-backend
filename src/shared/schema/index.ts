import { ConfigService } from '@nestjs/config';
import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { User, UserSchema } from './user.schema';
import { EventSchema } from './events.schema';
import { Post, PostSchema } from './post.schema';
import { DataLog, DataLogSchema } from './data.log.schema';
import { InviteToken, InviteTokenSchema } from './invite-tokens.schema';


// All Schema Models
export * from './basic.info.schema';
export * from './contact.info.schema';
export * from './data.log.schema';
export * from './user.schema';
export * from './events.schema';
export * from './post.schema';
export * from './invite-tokens.schema'
export * from './professional.info.schema'

const SCHEMA_LIST = [
  { name: User.name, schema: UserSchema, dbPrefix: 'APP' },
  { name: Event.name, schema: EventSchema, dbPrefix: 'APP' },
  { name: Post.name, schema: PostSchema, dbPrefix: 'APP' },
  { name: DataLog.name, schema: DataLogSchema, dbPrefix: 'LOG' },
  { name: InviteToken.name, schema: InviteTokenSchema, dbPrefix: 'APP' },
  // BasicInfo / ProfessionalInfo / ContactInfo are now embedded sub-documents
  // of User and are no longer registered as standalone collections.
];

export const CONNECTION = SCHEMA_LIST.reduce((result, data) => {
  result[data.name] = `${data.name}Connection`;
  return result;
}, {} as any);

// changed this to one becase it was causing load conflicts with the other dbs
export const ConnectionProviders = [
  {
    provide: 'APP_CONNECTION',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const uriKey = process.env.Test
        ? 'TEST_DATABASE_URL'
        : 'APP_DATABASE_URL';
      const configOps: ConnectOptions = config.get('dbConfig') || {
        autoIndex: false,
      };
      return createConnection(config.get(uriKey), configOps);
    },
  },
  {
    provide: 'LOG_CONNECTION',
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const uriKey = process.env.Test
        ? 'TEST_DATABASE_URL'
        : 'LOG_DATABASE_URL';
      const configOps: ConnectOptions = config.get('dbConfig') || {
        autoIndex: false,
      };
      return createConnection(config.get(uriKey), configOps);
    },
  },
];

export const SchemaProviders = SCHEMA_LIST.map((model) => {
  const isLog = model.dbPrefix === 'LOG';
  return {
    provide: model.name,
    useFactory: (connection: Connection) =>
      connection.model(model.name, model.schema),
    inject: [isLog ? 'LOG_CONNECTION' : 'APP_CONNECTION'],
  };
});

export { DBModule } from './db.module';
