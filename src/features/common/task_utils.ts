import { AnyModalBlock } from "slack-edge";
import { slack } from "../../slack";
import { syncWebsiteTask } from "../assistant/events/sync_website";
import { syncNotionTask } from "../assistant/events/sync_notion_index";
import { checkInboxRemindersTask } from "../inbox/check_reminders";
import { syncSlackTask } from "../assistant/events/sync_slack_index";

export const tasks = [
  syncNotionTask,
  syncWebsiteTask,
  syncSlackTask,
  checkInboxRemindersTask,
] as const;

export type TaskRequest = {
  name: string;
  options?: TaskOptions;
};

export type TaskOptions = {
  viewId?: string;
  log?: (data: any) => void;
}

export type Task<T = any, O extends TaskOptions = TaskOptions> = {
  name: string;
  run: (options: O, log: (data: T) => Promise<void>) => Promise<void>;
  display: (data: T) => AnyModalBlock[];
}

export async function performTask<T, O extends TaskOptions>(task: Task<T, O>, options: O): Promise<void> {

  const renderView = async (title: string, blocks: AnyModalBlock[]) => {
    if (options.viewId == null) return;
    await slack.client.views.update({
      view_id: options.viewId,
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

  options.log?.({task: task.name, status: "starting"});
  await renderView("🌀 Running", [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Starting '${task.name}'...`,
      },
    },
  ]);

  let blocks: AnyModalBlock[] = [];

  try {
    await task.run(options, async (data) => {
      blocks.push(...task.display(data));
      options.log?.(data);
      await renderView("🌀 Running", blocks);
    });

    options.log?.({task: task.name, status: "done"});
    await renderView("✅ Done", blocks);
  } catch (e: any) {
    console.error(e, e.message, e.errors);
    options.log?.({task: task.name, status: "error", error: e});
    await renderView("❌ Error", [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚫 Error for '${task.name}':\n${e}`,
        },
      },
    ]);
  }
}

export async function openTaskModal(triggerId: string) {
  const view = await slack.client.views.open({
    trigger_id: triggerId,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "🌀 Starting",
      },
      blocks: [
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "...",
            },
          ],
        },
      ],
    },
  });

  return view.view?.id;
}

export async function triggerTask<T, O extends TaskOptions>(task: Task<T, O>, options: O) {
  await fetch(`https://${currentUrl}/api/task`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ tasks: [{name: task.name, options}] }),
  });
}

export function runTasks(requests: TaskRequest[]): Response {

  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {

      for (var request of requests) {
        var task = tasks.find((t) => t.name == request.name);
        if (task) {
          await performTask(task as Task, {
            ...(request.options ?? {}),
            log: (data) => controller.enqueue(encoder.encode(JSON.stringify(data))),
          });
        }
      }
      
      controller.close();
    },
  });
  
  return new Response(customReadable, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
