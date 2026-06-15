import Redis, { RedisOptions } from 'ioredis';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis;

  private constructor() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(options);

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  /**
   * 设置带过期时间的 Key
   * @param key 键
   * @param value 值 (支持对象自动序列化)
   * @param ttl 过期时间（秒）
   */
  public async set(key: string, value: any, ttl?: number): Promise<'OK'> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      return this.client.set(key, stringValue, 'EX', ttl);
    }
    return this.client.set(key, stringValue);
  }

  /**
   * 读取 Key
   * @param key 键
   */
  public async get<T = any>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * 删除 Key
   * @param key 键
   */
  public async del(key: string): Promise<number> {
    return this.client.del(key);
  }
}

export const redisClient = RedisClient.getInstance();
export default redisClient;
