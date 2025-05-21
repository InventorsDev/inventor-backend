import { ConfigService } from '@nestjs/config';
import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { BasicInfo, BasicInfoSchema } from './basic.info.schema';
import { ContactInfo, ContactInfoSchema } from './contact.info.schema';
import { DataLog, DataLogSchema } from './data.log.schema';
import { EventSchema } from './events.schema';
import { InviteToken, InviteTokenSchema } from './invite-tokens.schema';
import {
  ProfessionalInfo,
  ProfessionalInfoSchema,
} from './professional.info.schema';
import { User, UserSchema } from './user.schema';
import { Post, PostSchema } from './post.schema'
import { PostComment, PostCommentSchema } from './postcomment.schema'

// All Schema Models
export * from './basic.info.schema';
export * from './contact.info.schema';
export * from './data.log.schema';
export * from './events.schema';
export * from './invite-tokens.schema';
export * from './professional.info.schema';
export * from './user.schema';

const SCHEMA_LIST = [
  { name: User.name, schema: UserSchema, dbPrefix: 'APP' },
  { name: PostComment.name, schema: PostCommentSchema, dbPrefix: 'APP' },
  { name: Event.name, schema: EventSchema, dbPrefix: 'APP' },
  { name: Post.name, schema: PostSchema, dbPrefix: 'APP' },
  { name: DataLog.name, schema: DataLogSchema, dbPrefix: 'LOG' },
  { name: InviteToken.name, schema: InviteTokenSchema, dbPrefix: 'APP' },
  { name: BasicInfo.name, schema: BasicInfoSchema, dbPrefix: 'APP' },
  {
    name: ProfessionalInfo.name,
    schema: ProfessionalInfoSchema,
    dbPrefix: 'APP',
  },
  { name: ContactInfo.name, schema: ContactInfoSchema, dbPrefix: 'APP' },
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
