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

export async function toUUID(id: string): Promise<string> {
  const hash = await toHash(id);
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(
    12,
    16
  )}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}