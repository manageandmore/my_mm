import { AnyTextField, ChatPostMessageResponse } from "slack-edge";
import { slack } from "../../../slack";
import { Task } from "../../common/task_utils";
import { ReceivedInboxEntry } from "../data";
import { asReadableDuration } from "../../common/time_utils";
import { cache } from "../../common/cache";
import { getButtonForInboxAction } from "../views/inbox_section";
import { getReminderMessage } from "../views/reminder_message";

export const checkInboxRemindersTask: Task = {
  name: "check reminders",
  async run(_, log) {
    await checkAndTriggerOverdueInboxReminders();
  },
  display(_) {
    return [];
  },
};

export const checkForRemindersAction = "check_for_reminders";

slack.action(checkForRemindersAction, async (request) => {
  await checkAndTriggerOverdueInboxReminders();
});

export const deleteAllMessagesAction = "delete_all_messages";

/**
 * Empties the complete inbox for a user.
 */
slack.action(deleteAllMessagesAction, async (request) => {
  const payload = request.payload;
  await cache.hset("inbox:received", {
    [payload.user.id]: [],
  });
});

/**
 * Checks all active inbox entries for overdue reminders and sends the notifications.
 *
 * This function is idempotent as long as its not called in parallel.
 */
export async function checkAndTriggerOverdueInboxReminders(): Promise<void> {
  var now = Date.now() / 1000;
  var inboxes =
    (await cache.hgetall<ReceivedInboxEntry[]>("inbox:received")) ?? {};

  for (var userId in inboxes) {
    let entries = inboxes[userId];
    let needsUpdate = false;

    for (let entry of entries) {
      if (entry.reminders == null) continue;

      let hasOverdueReminder = false;
      while (entry.reminders.length > 0) {
        if (entry.reminders[0] > now) break;

        hasOverdueReminder = true;
        // Remove this reminder so its not triggering again.
        entry.reminders.shift();
      }

      if (hasOverdueReminder) {
        // Mark that we need to update the inbox.
        needsUpdate = true;

        const sentMessage = await sendInboxNotification(
          userId,
          entry,
          "reminder"
        );

        entry.lastReminder = {
          type: 'reminder',
          messageTs: sentMessage.ts!,
          channelId: sentMessage.channel!,
        };
      }
    }

    // Only update the inbox if we actually triggered a reminder.
    if (needsUpdate) {
      await cache.hset<ReceivedInboxEntry[]>("inbox:received", {
        [userId]: entries,
      });
    }
  }
}

/**
 * Sends an inbox notification to a user.
 *
 * @param to The user id of the target user.
 * @param entry The inbox entry to notify about.
 * @param type "new" for a newly created entry, or "reminder" for an inbox reminder.
 * @returns The response from slack.
 */
export async function sendInboxNotification(
  to: string,
  entry: ReceivedInboxEntry,
  type: "new" | "reminder"
): Promise<ChatPostMessageResponse> {
  if (entry.lastReminder != null) {
    let {text, blocks} = getReminderMessage(entry, entry.lastReminder.type, false);

    await slack.client.chat.update({
      channel: entry.lastReminder.channelId,
      ts: entry.lastReminder.messageTs,
      text: text,
      blocks: blocks,
    });
  }
  
  let { text, blocks } = getReminderMessage(entry, type, true);

  let response = await slack.client.chat.postMessage({
    channel: to,
    // Text is fallback in case client doesn't support blocks
    text: text,
    blocks: blocks,
  });

  return response;
}
