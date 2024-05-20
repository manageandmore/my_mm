import { kv } from "@vercel/kv";
import { cache } from "../../utils";
import { slack } from "../../slack";

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

export type InboxAction = {
  label: string;
  style: "primary" | "danger" | null;
};

export type SentInboxEntry = InboxEntry & {
  recipients: string[];
  resolutions: { [user: string]: InboxEntryResolution };
};

export type InboxEntryResolution = {
  action: InboxAction;
  time: string; // iso timestamp
};

export type ReceivedInboxEntry = InboxEntry & {
  sender: string;
};

export type InboxEntryOptions = {
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

// hours until deadline
const remindHoursBeforeDeadline = [1, 8, 24, 24 * 3, 24 * 7, 24 * 14];

export async function createInboxEntry(
  options: InboxEntryOptions
): Promise<void> {
  let reminders: string[] = [];

  const enableReminders = options.enableReminders && options.deadline != null;
  if (enableReminders) {
    var deadline = Date.parse(options.deadline!);
    for (var hours of remindHoursBeforeDeadline) {
      reminders.unshift(
        new Date(deadline - hours * 60 * 60 * 1000).toISOString()
      );
    }
  }

  const recipients: string[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    var response = await slack.client.conversations.members({
      channel: options.message.channel,
      cursor: nextCursor,
    });
    recipients.push(...(response.members ?? []));
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

  const entries =
    (await cache.hget<SentInboxEntry[]>(
      "inbox:sent",
      options.message.userId
    )) ?? [];

  await cache.hset<SentInboxEntry[]>("inbox:sent", {
    [options.message.userId]: [
      { ...entry, recipients: recipients, resolutions: {} },
      ...entries,
    ],
  });

  var inboxes =
    (await cache.hmget<ReceivedInboxEntry[]>(
      "inbox:received",
      ...recipients
    )) ?? {};

  await cache.hset<ReceivedInboxEntry[]>(
    "inbox:received",
    Object.fromEntries(
      recipients.map((recipient) => {
        return [
          recipient,
          [
            { ...entry, sender: options.message.userId },
            ...(inboxes[recipient] ?? []),
          ],
        ];
      })
    )
  );

  if (options.notifyOnCreate) {

    var timeLeft = entry.deadline != null ? asReadableDuration(Date.now() - new Date(entry.deadline!).valueOf()) : null;
    var responseNote = timeLeft != null ? ` - You have ${timeLeft} to respond` : '';

    for (var recipient of recipients) {
      await slack.client.chat.postMessage({
        channel: recipient,
        text: `📬 New Inbox Message${responseNote}:\n${entry.description}`,
      });
    }
  }
}

export async function loadSentInboxEntries(
  userId: string
): Promise<SentInboxEntry[]> {
  var entries = await cache.hget<SentInboxEntry[]>("inbox:sent", userId);
  return entries ?? [];
}

export async function loadReceivedInboxEntries(
  userId: string
): Promise<ReceivedInboxEntry[]> {
  var entries = await cache.hget<ReceivedInboxEntry[]>(
    "inbox:received",
    userId
  );
  return entries ?? [];
}

export async function resolveInboxEntry(options: {
  messageTs: string;
  sender: string;
  userId: string;
  action: InboxAction;
}): Promise<void> {
  var inbox =
    (await cache.hget<ReceivedInboxEntry[]>(
      "inbox:received",
      options.userId
    )) ?? [];

  inbox = inbox.filter((e) => e.message.ts != options.messageTs);

  await cache.hset("inbox:received", { [options.userId]: inbox });

  var sentInbox =
    (await cache.hget<SentInboxEntry[]>("inbox:sent", options.sender)) ?? [];

  sentInbox = sentInbox.map((e) => {
    if (e.message.ts == options.messageTs) {
      return {
        ...e,
        resolutions: {
          ...e.resolutions,
          [options.userId]: {
            action: options.action,
            time: new Date().toISOString(),
          },
        },
      };
    } else {
      return e;
    }
  });

  await cache.hset("inbox:sent", { [options.sender]: sentInbox });
}

export async function triggerOverdueInboxReminders(): Promise<void> {
  var now = new Date().toISOString();
  var inboxes = await cache.hgetall<ReceivedInboxEntry[]>("inbox:received") ?? {};
  
  for (var userId in inboxes) {

    var entries = inboxes[userId];
    var needsUpdate = false;

    for (var entry of entries) {
      var nextReminder = entry.reminders?.at(0);
      if (nextReminder != undefined && nextReminder < now) {
        entry.reminders?.shift();
        needsUpdate = true;

        var timeLeft = asReadableDuration(Date.now() - new Date(entry.deadline!).valueOf());

        await slack.client.chat.postMessage({
          channel: userId,
          text: `📬 Inbox Reminder: You have ${timeLeft} left to respond to this message:\n${entry.description}`,
        });
      }
    }

    if (needsUpdate) {
      await cache.hset<ReceivedInboxEntry[]>("inbox:received", {[userId]: entries});
    }
  }

}


function asReadableDuration(millis: number): string {

  var seconds = millis / 1000;
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var weeks = days / 7;

  if (hours < 1) {
    return "less than one hour";
  } else if (hours < 2) {
    return `one hour`;
  } else if (days < 1) {
    return `${Math.floor(hours)} hours`;
  } else if (days < 2) {
    return `one day`;
  } else if (weeks < 1) {
    return `${Math.floor(days)} days`;
  } else if (weeks < 2) {
    return "one week";
  } else {
    return `${Math.floor(weeks)} weeks`;
  }
}