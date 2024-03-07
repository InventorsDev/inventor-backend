import { createClient } from 'redis';
import { promisifySilent } from './helper.util';
import { configs } from '../configs';

export let redisClient: any = null;

export const startRedis = async () => {
  redisClient = createClient({
    ...configs().redisConfig,
    url: process.env.REDIS_URL,
  } as any);
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Connected'));

  await redisClient.connect();

  return redisClient as any;
};

export const redisSet = async (
  key: string,
  value: Record<string, any>,
  options?: Record<string, any>,
) => {
  if (!redisClient) await startRedis();
  key = process.env.NODE_ENV + ':' + key;
  await promisifySilent(redisClient.set(key, JSON.stringify(value), options));
};

export const redisGet = async (key: string) => {
  if (!redisClient) await startRedis();
  key = process.env.NODE_ENV + ':' + key;
  const record: any = await promisifySilent(redisClient.get(key));
  if (record) return JSON.parse(record as any);
  return record;
};

export const redisDel = async (key: string) => {
  if (!redisClient) await startRedis();
  key = process.env.NODE_ENV + ':' + key;
  await promisifySilent(redisClient.del(key));
};
