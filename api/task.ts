import { RequestContext } from "@vercel/edge";
import { TaskRequest, runTasks } from "../src/features/common/task_utils";

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
export default async function task(request: Request, context: RequestContext) {
  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  var data = request.method == "POST" ? await request.json() : null;
  var tasks = data.tasks as TaskRequest[];

  return runTasks(tasks);
};