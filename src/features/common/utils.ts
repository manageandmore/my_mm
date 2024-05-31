import { AnyModalBlock } from "slack-edge";

export function toMap<T, K, V>(
  entries: T[],
  key: (e: T) => K,
  val: (e: T) => V
): Map<K, V> {
  return entries.reduce((map, e) => map.set(key(e), val(e)), new Map<K, V>());
}

export async function toHash(data: string) {
  let digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(data)
  );
  let hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hash;
}
