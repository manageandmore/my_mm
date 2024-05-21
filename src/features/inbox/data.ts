import { cache } from "../../utils";
import { slack } from "../../slack";
import { ChatPostMessageResponse } from "slack-edge";
import { asReadableDuration } from "../common/time_utils";

/** The base type for an inbox entry. */
export type InboxEntry = {
  message: {
    channel: string;
    ts: string;
  };
  description: string;
  actions: InboxAction[];
  deadline?: string; // iso timestamp
  reminders?: string[]; // list of iso timestamps, ordered by earliest to latest
};

/** The type of an inbox action. */
export type InboxAction = {
  label: string;
  /** The style for the action button in slack. */
  style: "primary" | "danger" | null;
};

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
  time: string; // iso timestamp
};

/** The type of an inbox entry as viewed by the user that received it. */
export type ReceivedInboxEntry = InboxEntry & {
  senderId: string;
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
  deadline?: string;

  notifyOnCreate: boolean;
  enableReminders: boolean;
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
  let reminders: string[] = [];

  const enableReminders = options.enableReminders && options.deadline != null;
  if (enableReminders) {
    var deadline = Date.parse(options.deadline!);

    // Use a fixed schedule for now.
    const remindHoursBeforeDeadline = [1, 8, 24, 24 * 3, 24 * 7, 24 * 14];

    for (var hours of remindHoursBeforeDeadline) {
      reminders.unshift(
        new Date(deadline - hours * 60 * 60 * 1000).toISOString()
      );
    }
  }

  const recipientIds: string[] = [];
  let nextCursor: string | undefined = undefined;

  // Get all members (paginated).
  do {
    var response = await slack.client.conversations.members({
      channel: options.message.channel,
      cursor: nextCursor,
    });
    recipientIds.push(...(response.members ?? []));
    nextCursor = response.response_metadata?.next_cursor;
  } while (nextCursor != null);

  const entry: InboxEntry = {
    message: {
      channel: options.message.channel,
      ts: options.message.ts,
    },
    description: options.description,
    actions: options.actions,
    deadline: options.deadline,
    reminders: reminders,
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

  // Get the current received entries for all recipients.
  var inboxes =
    (await cache.hmget<ReceivedInboxEntry[]>(
      "inbox:received",
      ...recipientIds
    )) ?? {};

  // Update the received entries for all recipients.
  await cache.hset<ReceivedInboxEntry[]>(
    "inbox:received",
    Object.fromEntries(
      recipientIds.map((recipientId) => {
        return [
          recipientId,
          [
            { ...entry, senderId: options.message.userId },
            ...(inboxes[recipientId] ?? []),
          ],
        ];
      })
    )
  );

  if (options.notifyOnCreate) {
    // Notify all recipients.
    for (var recipientId of recipientIds) {
      var r = await sendInboxNotification(recipientId, entry, 'new');

      // We need to track if we get rate-limited for this.
      // Sending out bursts of messages is allowed but the docs are not clear on the exact limits.
      if (r.ok == false && r.error == "rate_limited") {
        console.error("App got rate-limited while sending out messages.", r);
        break;
      }
    }
  }
}

/** Loads all sent inbox entries for a user. */
export async function loadSentInboxEntries(
  userId: string
): Promise<SentInboxEntry[]> {
  var entries = await cache.hget<SentInboxEntry[]>("inbox:sent", userId);
  return entries ?? [];
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

/**
 * Resolves one inbox entry for a user with the chosen [action].
 * 
 * This removes the entry from the received inbox entries of the user and adds the
 * inbox resolution to the entry of the sender.
 */
export async function resolveInboxEntry(options: {
  messageTs: string;
  senderId: string;
  userId: string;
  action: InboxAction;
}): Promise<void> {
  // Get the current received entries for the user.
  var receivedInbox =
    (await cache.hget<ReceivedInboxEntry[]>(
      "inbox:received",
      options.userId
    )) ?? [];

  // Remove the target entry based on the message id.
  await cache.hset("inbox:received", { 
    [options.userId]: receivedInbox.filter((e) => e.message.ts != options.messageTs), 
  });

  // Get the current sent entries for the sender.
  var sentInbox =
    (await cache.hget<SentInboxEntry[]>("inbox:sent", options.senderId)) ?? [];

  // Add the resolution of the user to the target entry.
  await cache.hset("inbox:sent", { 
    [options.senderId]: sentInbox.map((e) => {
      if (e.message.ts == options.messageTs) {
        return {
          ...e,
          resolutions: {
            ...e.resolutions,
            // Sets the resolution for [userId] with the [action] and current [time].
            [options.userId]: {
              action: options.action,
              time: new Date().toISOString(),
            },
          },
        };
      } else {
        return e;
      }
    }),
  });
}

/**
 * Checks all active inbox entries for overdue reminders and sends the notifications.
 * 
 * This function is idempotent as long as its not called in parallel.
 */
export async function checkAndTriggerOverdueInboxReminders(): Promise<void> {
  var now = new Date().toISOString();
  var inboxes = await cache.hgetall<ReceivedInboxEntry[]>("inbox:received") ?? {};
  
  for (var userId in inboxes) {

    var entries = inboxes[userId];
    var needsUpdate = false;

    for (var entry of entries) {
      var nextReminder = entry.reminders?.at(0);
      if (nextReminder != undefined && nextReminder < now) {
        // Remove this reminder so its not triggering again.
        entry.reminders?.shift();
        // Mark that we need to update the inbox.
        needsUpdate = true;

        await sendInboxNotification(userId, entry, 'reminder');
      }
    }

    // Only update the inbox if we actually triggered a reminder.
    if (needsUpdate) {
      await cache.hset<ReceivedInboxEntry[]>("inbox:received", {[userId]: entries});
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
async function sendInboxNotification(to: string, entry: InboxEntry, type: "new" | "reminder"): Promise<ChatPostMessageResponse> {

  var title = type == "new" ? "New Inbox Message" : "Inbox Reminder";
  
  var note = "";
  if (entry.deadline != null) {
    var timeLeft = asReadableDuration(Date.now() - new Date(entry.deadline!).valueOf());

    note = type == "new" ? `You have ${timeLeft} to respond` : `You have ${timeLeft} to respond to this message`;
  }

  var response = await slack.client.chat.postMessage({
    channel: to,
    text: `📬 ${title}${note.length > 0 ? ` | ${note}` : ''}:\n${entry.description}`,
    // TODO: add blocks to make a nice message ui
  });

  return response;
}
