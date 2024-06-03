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
