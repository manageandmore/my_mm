import { cache } from "../common/cache";
import { slack } from "../../slack";
import { sendInboxNotification } from "./events/check_reminders";
import { getReminderMessage } from "./views/reminder_message";

/** The base type for an inbox entry. */
export type InboxEntry = {
  message: {
    channel: string;
    ts: string;
    url: string;
  };
  description: string;
  actions: InboxAction[];
  deadline?: string; // iso timestamp
  reminders?: string[]; // list of unix timestamps, ordered by earliest to latest
  calendarUrl?: string;
};

/** The type of an inbox action. */
export type InboxAction = {
  label: string;
  /** The style for the action button in slack. */
  style?: "primary" | "danger";
  /** The action id for the action button in slack. */
  action_id: string;
};

export const messageDoneAction: InboxAction = {
  label: "✅ Done",
  style: "primary",
  action_id: "message_action_done",
};
export const messageDismissedAction: InboxAction = {
  label: "🗑️ Dismiss",
  action_id: "message_action_dismiss",
};
export const messageAcceptAction: InboxAction = {
  label: "✅ Accept",
  style: "primary",
  action_id: "message_action_accept",
};
export const messageDeclineAction: InboxAction = {
  label: "❌ Decline",
  style: "danger",
  action_id: "message_action_decline",
};
export const messageThumbsUpAction: InboxAction = {
  label: "👍 Thumbs Up",
  action_id: "message_action_thumbsup",
};

export const allResponseActions = [
  messageDoneAction,
  messageDismissedAction,
  messageAcceptAction,
  messageDeclineAction,
  messageThumbsUpAction,
];
export const defaultResponseActions = [
  messageDoneAction,
  messageDismissedAction,
];

/** The type of a inbox entry as viewed by the user that sent it. */
export type SentInboxEntry = InboxEntry & {
  recipientIds: string[];
  resolutions: { [userId: string]: InboxEntryResolution };
};

/**
 * The type of a single users resolution of an inbox entry.
 *
 * A resolution is created when a user choses an action for an received inbox entry, which is
 * then written back to the sent inbox entry.
 * */
export type InboxEntryResolution = {
  action: InboxAction;
  timestamp: number; // unix timestamp
};

/** The type of an inbox entry as viewed by the user that received it. */
export type ReceivedInboxEntry = InboxEntry & {
  senderId: string;
  lastReminder?: InboxReminder;
};

export type InboxReminder = {
  type: "new" | "reminder";
  messageTs: string;
  channelId: string;
};

/** The options for creating a new inbox entry. */
export type CreateInboxEntryOptions = {
  message: {
    channel: string;
    ts: string;
    userId: string;
  };
  description: string;
  actions: InboxAction[];
  deadline?: number; // unix timestamp

  notifyOnCreate: boolean;
  enableReminders: boolean;
  calendarUrl?: string;
};

/**
 * Creates a new inbox entry for all members of the source [channel].
 *
 * If [deadline] is set and [enableReminders] is true, this will set a number of reminders on a fixed schedule.
 *
 * If [notifyOnCreate] is true, this will send a notification to all recipients.
 */
export async function createInboxEntry(
  options: CreateInboxEntryOptions
): Promise<void> {
  let reminders: number[] = [];

  const enableReminders = options.enableReminders && options.deadline != null;
  if (enableReminders) {
    // Use a fixed schedule for now.
    const remindHoursBeforeDeadline = [1, 8, 24, 24 * 3, 24 * 7, 24 * 14];
    const nowTimestamp = Date.now() / 1000;

    for (let hours of remindHoursBeforeDeadline) {
      const reminderTimestamp = options.deadline! - hours * 60 * 60;
      if (reminderTimestamp > nowTimestamp) {
        reminders.unshift(reminderTimestamp);
      }
    }
  }

  const recipientIds: string[] = [];
  let nextCursor: string | undefined = undefined;

  // Get all members (paginated).
  if (options.message.channel != null && options.message.channel != "") {
    do {
      let response = await slack.client.conversations.members({
        channel: options.message.channel,
        cursor: nextCursor,
      });
      recipientIds.push(...(response.members ?? []));
      nextCursor = response.response_metadata?.next_cursor;
    } while (nextCursor != null && nextCursor != "");
  }

  const link = await slack.client.chat.getPermalink({
    channel: options.message.channel,
    message_ts: options.message.ts,
  });

  const entry: InboxEntry = {
    message: {
      channel: options.message.channel,
      ts: options.message.ts,
      url: link.permalink!,
    },
    description: options.description,
    actions: options.actions,
    deadline: options.deadline,
    reminders: reminders,
    calendarUrl: options.calendarUrl,
  };

  // Get the current sent entries for the sender.
  const entries =
    (await cache.hget<SentInboxEntry[]>(
      "inbox:sent",
      options.message.userId
    )) ?? [];

  // Update the sent entries.
  await cache.hset<SentInboxEntry[]>("inbox:sent", {
    [options.message.userId]: [
      { ...entry, recipientIds: recipientIds, resolutions: {} },
      ...entries,
    ],
  });

  let reminderTsArray: { [key: string]: InboxReminder } = {};
  if (options.notifyOnCreate) {
    // Batch notifications
    const BATCH_SIZE = 100;
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + BATCH_SIZE);
      await sendNotificationsBatch(batch, entry, options.message.userId, reminderTsArray);
    }
  }

  // Add the entry for all recipients.
  await updateRecipientsInboxes(recipientIds, (inbox, recipientId) => [
    {
      ...entry,
      senderId: options.message.userId,
      lastReminder: reminderTsArray[recipientId],
    },
    ...inbox,
  ]);
}

async function sendNotificationsBatch(recipientIds: string[], entry: InboxEntry, senderId: string, reminderTsArray: {[key:string]: InboxReminder}) {
  const sendPromises = recipientIds.map(async (recipientId) => {
    let sentMessage;
    let retries = 3; // Number of retry attempts
    let delay = 1000; // Delay between retries (ms)

    do {
      try {
        sentMessage = await sendInboxNotification(
            recipientId,
            { ...entry, senderId: senderId },
            "new"
        );
        if (sentMessage.ok) {
          console.log("Sent notification to", sentMessage.channel, sentMessage.ts!);
          reminderTsArray[recipientId] = {
            type: "new",
            messageTs: sentMessage.ts!,
            channelId: sentMessage.channel!,
          };
          return;
        } else {
          console.error("Error sending notification:", sentMessage.error);
        }

      } catch (error) {
        console.error("Error sending notification:", error);
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    } while (retries > 0 && !sentMessage?.ok);


    if(!sentMessage?.ok) {
      console.error(`Failed to send notification to ${recipientId} after multiple retries.`);
    }
  });

  await Promise.all(sendPromises);
}

/** Loads all sent inbox entries for a user. */
export async function loadSentInboxEntries(
  userId: string
): Promise<SentInboxEntry[]> {
  var entries = await cache.hget<SentInboxEntry[]>("inbox:sent", userId);
  return entries ?? [];
}

/** Deletes a sent inbox entry for a user. */
export async function deleteSentInboxEntry(
  userId: string,
  messageTs: string
): Promise<void> {
  //Delete the entry for the sender.
  const oldEntries = await loadSentInboxEntries(userId);
  const targetEntry = oldEntries.find((e) => e.message.ts == messageTs);

  if (!targetEntry) {
    return;
  }

  let openReminderEntries: ReceivedInboxEntry[] = [];

  // Delete the entry for all recipients.
  await updateRecipientsInboxes(targetEntry.recipientIds, (inbox) => {
    var entry = inbox.find((e) => e.message.ts == messageTs);

    if (entry?.lastReminder != null) {
      openReminderEntries.push(entry);
    }

    return inbox.filter((e) => e != entry);
  });

  // Delete the entry for the sender.
  await cache.hset<SentInboxEntry[]>("inbox:sent", {
    [userId]: oldEntries.filter((e) => e.message.ts != messageTs),
  });

  // Remove buttons from all reminder messages.
  for (let entry of openReminderEntries) {
    let { text, blocks } = getReminderMessage(
      entry,
      entry.lastReminder!.type,
      false
    );

    await slack.client.chat.update({
      channel: entry.lastReminder!.channelId,
      ts: entry.lastReminder!.messageTs,
      text: text,
      blocks: blocks,
    });
  }
}

/** Loads all received inbox entries for a user. */
export async function loadReceivedInboxEntries(
  userId: string
): Promise<ReceivedInboxEntry[]> {
  var entries = await cache.hget<ReceivedInboxEntry[]>(
    "inbox:received",
    userId
  );
  return entries ?? [];
}

async function updateRecipientsInboxes(
  recipientIds: string[],
  update: (
    inbox: ReceivedInboxEntry[],
    recipientId: string
  ) => ReceivedInboxEntry[]
): Promise<void> {
  var inboxes =
    (await cache.hmget<ReceivedInboxEntry[]>(
      "inbox:received",
      ...recipientIds
    )) ?? {};

  await cache.hset<ReceivedInboxEntry[]>(
    "inbox:received",
    Object.fromEntries(
      recipientIds.map((recipientId) => {
        let updatedInbox = update(inboxes[recipientId] ?? [], recipientId);
        return [recipientId, updatedInbox];
      })
    )
  );
}
