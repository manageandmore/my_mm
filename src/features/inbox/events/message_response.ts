import { slack } from "../../../slack";
import { cache } from "../../common/cache";
import { ButtonAction } from "slack-edge";
import {
  InboxAction,
  ReceivedInboxEntry,
  SentInboxEntry,
  messageDismissedAction,
  messageDoneAction,
} from "../data";

slack.action(messageDoneAction.action_id, async (request) => {
  const payload = request.payload;
  const actionData = JSON.parse((payload.actions[0] as ButtonAction).value);

  await resolveInboxEntry({
    messageTs: actionData.messageTs,
    senderId: actionData.senderId,
    userId: request.payload.user.id,
    action: messageDoneAction,
  });
});

slack.action(messageDismissedAction.action_id, async (request) => {
  const payload = request.payload;
  const actionData = JSON.parse((payload.actions[0] as ButtonAction).value);

  await resolveInboxEntry({
    messageTs: actionData.messageTs,
    senderId: actionData.senderId,
    userId: request.payload.user.id,
    action: messageDismissedAction,
  });
});

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

  // Remove the target entry based on ts.
  await cache.hset("inbox:received", {
    [options.userId]: receivedInbox.filter(
      (e) => e.message.ts != options.messageTs
    ),
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

