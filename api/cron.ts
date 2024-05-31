import { RequestContext } from "@vercel/edge";
import { syncNotionTask } from "../src/features/assistant/events/sync_notion_index";

import { runTasks } from "../src/features/common/task_utils";
import { checkInboxRemindersTask } from "../src/features/inbox/check_reminders";
import { syncWebsiteTask } from "../src/features/assistant/events/sync_website";

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

  return runTasks([
    { name: syncNotionTask.name },
    { name: syncWebsiteTask.name },
    { name: checkInboxRemindersTask.name },
  ]);
}
