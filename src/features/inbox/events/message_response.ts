import { slack } from "../../../slack";
import { cache } from "../../common/cache";
import { ButtonAction } from "slack-edge";
import {
  InboxAction,
  ReceivedInboxEntry,
  SentInboxEntry,
  checkAndTriggerOverdueInboxReminders,
  messageDismissedAction,
  messageDoneAction,
} from "../data";

slack.action(
  messageDoneAction.action_id || messageDismissedAction.action_id,
  async (request) => {
    const payload = request.payload;
    const actionData = JSON.parse((payload.actions[0] as ButtonAction).value);

    await resolveInboxEntry({
      entry: actionData.entry,
      userId: actionData.userId,
      action: actionData.action,
    });
  }
);

/**
 * Resolves one inbox entry for a user with the chosen [action].
 *
 * This removes the entry from the received inbox entries of the user and adds the
 * inbox resolution to the entry of the sender.
 */
export async function resolveInboxEntry(options: {
  entry: ReceivedInboxEntry;
  userId: string;
  action: InboxAction;
}): Promise<void> {
  // Get the current received entries for the user.
  var receivedInbox =
    (await cache.hget<ReceivedInboxEntry[]>(
      "inbox:received",
      options.userId
    )) ?? [];

  // Remove the target entry.
  await cache.hset("inbox:received", {
    [options.userId]: receivedInbox.filter((e) => e != options.entry),
  });

  // Get the current sent entries for the sender.
  var sentInbox =
    (await cache.hget<SentInboxEntry[]>(
      "inbox:sent",
      options.entry.senderId
    )) ?? [];

  // Add the resolution of the user to the target entry.
  await cache.hset("inbox:sent", {
    [options.entry.senderId]: sentInbox.map((e) => {
      if (e.message.ts == options.entry.message.ts) {
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

export const checkForRemindersAction = "check_for_reminders";

slack.action(checkForRemindersAction, async (request) => {
  await checkAndTriggerOverdueInboxReminders();
});
