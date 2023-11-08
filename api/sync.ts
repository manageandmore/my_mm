import { loadNotionPages } from "../src/features/assistant/data/load_pages";
import { RequestContext } from "@vercel/edge";

/**
 * Configures the vercel deployment to use the edge runtime.
 */
export const config = {
  runtime: "edge",
};

/**
 * Handler for the /api/sync route.
 *
 * This route is called by a cron job each day at 2 AM.
 *  */
export default async function events(
  request: Request,
  context: RequestContext
) {
  context.waitUntil(loadNotionPages());
  return new Response("Sync started.");
}
