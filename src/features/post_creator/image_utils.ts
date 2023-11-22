import { currentUrl } from "../../constants";

export type PostCreatorOptions = {
  size?: number;
  title?: string;
  subtitle?: string;
  image?: string;
  file?: string;
  logoPosition?: string;
  titleColor?: string;
  titleAlignment?: string;
};

export function getPostImageUrl(
  options: PostCreatorOptions,
  config?: { encode: boolean; download?: boolean }
): string {
  return `https://${currentUrl}/api/social.png${makeQueryParams(
    { ...options, download: config?.download == true ? 1 : undefined },
    config?.encode ?? false
  )}`;
}

function makeQueryParams(
  params: Record<string, string | number | undefined>,
  encode: boolean
): string {
  if (encode) {
    const data = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    return "?d=" + btoa(JSON.stringify(data));
  }
  let query = "";
  for (let key in params) {
    if (params[key] == null) continue;
    if (query.length > 0) query += "&";
    else query += "?";
    query += `${key}=${encodeURIComponent(params[key]!)}`;
  }
  return query;
}
