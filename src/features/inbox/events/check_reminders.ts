import { AnyTextField, ChatPostMessageResponse } from "slack-edge";
import { slack } from "../../../slack";
import { Task } from "../../common/task_utils";
import { ReceivedInboxEntry } from "../data";
import { asReadableDuration } from "../../common/time_utils";
import { cache } from "../../common/cache";
import { getButtonForInboxAction } from "../views/inbox_section";

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


/**
 * Checks all active inbox entries for overdue reminders and sends the notifications.
 *
 * This function is idempotent as long as its not called in parallel.
 */
export async function checkAndTriggerOverdueInboxReminders(): Promise<void> {
  var now = new Date().toISOString();
  var inboxes =
    (await cache.hgetall<ReceivedInboxEntry[]>("inbox:received")) ?? {};

  for (var userId in inboxes) {
    var entries = inboxes[userId];
    var needsUpdate = false;

    for (var entry of entries) {
      console.log(entry);
      var nextReminder = entry.reminders?.at(0);
      if (nextReminder != undefined && nextReminder < now) {
        // Remove this reminder so its not triggering again.
        entry.reminders?.shift();
        // Mark that we need to update the inbox.
        needsUpdate = true;

        await sendInboxNotification(userId, entry, "reminder");
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
  let title = type == "new" ? "New Inbox Message" : "Inbox Reminder";

  let deadlineHint: AnyTextField[] = [];
  if (entry.deadline != null) {
    let timeLeft = asReadableDuration(
      new Date(entry.deadline!).valueOf() - Date.now()
    );

    deadlineHint = [{
      type: "mrkdwn",
      text: `*You have ${timeLeft}${type == "new" ? "" : " left"} to respond to this message.*`,
    }];
  }

  let response = await slack.client.chat.postMessage({
    channel: to,
    // Text is fallback in case client doesn't support blocks
    text: `📬 *${title}*:\n${entry.description}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `📬 *${title}*:`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: entry.description,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View original message",
            emoji: true,
          },
          url: entry.message.url,
        },
      },
      {
        type: "context",
        elements: [
          ...deadlineHint,
          {
            type: "mrkdwn",
            text: "_You can mark this message as resolved by clicking one of the buttons below. This will notify the message author and remove it from your inbox._",
          },
        ],
      },
      {
        type: "actions",
        elements: entry.actions.map((a) => getButtonForInboxAction(a, entry)),
      },
    ],
  });

  return response;
}
