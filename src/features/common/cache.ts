import { kv } from "@vercel/kv";
import { cachePrefix } from "../../constants";

/**
 * Shared cache for the app.
 * 
 * Since staging and production environments use the same underlying redis database,
 * we prefix all cache keys with the environments `cacheKey` to avoid clashes between envs.
 */
class Cache {
  set<T>(...args: Parameters<typeof kv.set<T>>) {
    let [key, ...rest] = args;
    return kv.set<T>(cachePrefix + key, ...rest);
  }

  get<T>(...args: Parameters<typeof kv.get<T>>) {
    let [key, ...rest] = args;
    return kv.get<T>(cachePrefix + key, ...rest);
  }

  async delAll(...args: Parameters<typeof kv.keys>) {
    let [key, ...rest] = args;
    let keys = await kv.keys(cachePrefix + key, ...rest);
    if (keys.length == 0) return;
    await kv.del(...keys);
  }

  hset<T>(...args: Parameters<typeof kv.hset<T>>) {
    let [key, ...rest] = args;
    return kv.hset<T>(cachePrefix+key, ...rest);
  }

  hget<T>(...args: Parameters<typeof kv.hget<T>>) {
    let [key, ...rest] = args;
    return kv.hget<T>(cachePrefix+key, ...rest);
  }

  hmget<T>(...args: Parameters<typeof kv.hmget<Record<string, T>>>) {
    let [key, ...rest] = args;
    return kv.hmget<Record<string, T>>(cachePrefix+key, ...rest);
  }

  hgetall<T>(...args: Parameters<typeof kv.hgetall<Record<string, T>>>) {
    let [key, ...rest] = args;
    return kv.hgetall<Record<string, T>>(cachePrefix+key, ...rest);
  }
}

/**
 * Shared cache for the app.
 */
export const cache = new Cache();
