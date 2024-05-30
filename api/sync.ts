import { loadNotionPages } from "../src/features/assistant/data/load_pages";
import { RequestContext } from "@vercel/edge";
import { checkAndTriggerOverdueInboxReminders } from "../src/features/inbox/data";
import { syncNotionIndex } from "../src/features/assistant/events/sync_notion_index";
import { AnyModalBlock } from "slack-edge";
import { slack } from "../src/slack";
import { syncWebsite } from "../src/features/assistant/events/sync_website";
import { runTask } from "../src/features/common/utils";

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
  var data = request.method == "POST" ? await request.json() : null;

  console.log("STARTED SYNC", data);

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      
      const update = async (title: string, blocks: AnyModalBlock[]) => {

        controller.enqueue(encoder.encode(JSON.stringify(blocks)));

        if ("viewId" in data) {
          await slack.client.views.update({
            view_id: data.viewId,
            view: {
              type: "modal",
              title: {
                type: "plain_text",
                text: title,
              },
              blocks: blocks,
            },
          });
        }
      };

      if (!data.viewId) {
        await runTask(syncWebsite, update);
      }

      await runTask(syncNotionIndex, update);

      controller.close();
    },
  });
  
  return new Response(customReadable, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
