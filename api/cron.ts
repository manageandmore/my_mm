import { RequestContext } from "@vercel/edge";
import { runTasks } from "../src/features/common/task_utils";
import { syncNotionTask } from "../src/features/assistant/loaders/load_pages";
import { syncWebsiteTask } from "../src/features/assistant/loaders/load_website";
import { checkInboxRemindersTask } from "../src/features/inbox/events/check_reminders";

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
 * This route is called by a cron job each day at 11:30 AM.
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
