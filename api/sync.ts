import { loadNotionPages } from "../src/features/assistant/data/load_pages";
import { RequestContext } from "@vercel/edge";
import { checkAndTriggerOverdueInboxReminders } from "../src/features/inbox/data";

/**
 * Configures the vercel deployment to use the edge runtime.
 */
export const config = {
  runtime: "edge",
};

const cronSecret = process.env.CRON_SECRET;

/**
 * Handler for the /api/sync route.
 *
 * This route is called by a cron job each day at 2 AM.
 *  */
export default async function sync(request: Request, context: RequestContext) {
  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  context.waitUntil(loadNotionPages());
  context.waitUntil(checkAndTriggerOverdueInboxReminders());
  return new Response("Sync started.");
}
