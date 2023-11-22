import { kv } from "@vercel/kv";
import { cachePrefix } from "./constants";

/** Hashes an object and returns a hex string. */
export async function hash(object: any): Promise<string> {
  let buffer = Buffer.from(JSON.stringify(object));
  let digest = await crypto.subtle.digest("SHA-1", buffer);
  return buf2hex(digest);
}

function buf2hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/** Helper type to get the property type of some type. */
export type Prop<T, K extends keyof T> = T extends { [key in K]: infer V }
  ? V
  : undefined;

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
    return kv.del(...keys);
  }
}

export const cache = new Cache();
