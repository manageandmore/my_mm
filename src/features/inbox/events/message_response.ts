import { slack } from "../../../slack";
import { cache } from "../../common/cache";
import { ButtonAction } from "slack-edge";
import {
  InboxAction,
  ReceivedInboxEntry,
  SentInboxEntry,
  allResponseActions,
} from "../data";
import { updateHomeViewForUser } from "../../home/event";
import { getChannelIdForUser } from "../../common/id_utils";

registerActions();

function registerActions() {
  for (let action of allResponseActions) {
    slack.action(
      action.action_id,
      async (request) => {
        const payload = request.payload;

        if (payload.channel && payload.message) {
          await slack.client.chat.update({
            channel: payload.channel!.id,
            ts: payload.message!.ts,
            text: payload.message!.text ?? "",
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: payload.message.text ?? "",
                },
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `*You responded with [${action.label}] to this message.*`,
                  },
                ],
              },
            ],
          });
        }
      },
      async (request) => {
        const payload = request.payload;
        const actionData = JSON.parse(
          (payload.actions[0] as ButtonAction).value
        );

        await resolveInboxEntry({
          messageTs: actionData.messageTs,
          senderId: actionData.senderId,
          userId: request.payload.user.id,
          action: action,
        });

        // Update the home page.
        await updateHomeViewForUser(request.payload.user.id);
      }
    );
  }
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

  // Copy message for later use
  const messageDescription = receivedInbox.find(
    (e) => e.message.ts == options.messageTs
  )?.description;
  // Copy reminderTs for later use
  const reminderTsArray = receivedInbox.find(
    (e) => e.message.ts == options.messageTs
  )?.reminderMessageTs;

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

  const channelId = await getChannelIdForUser(options.userId);
  console.log(channelId);

  for (const reminderTs of reminderTsArray ?? []) {
    await slack.client.chat.update({
      channel: channelId!,
      ts: reminderTs,
      text: messageDescription?.toString() ?? "",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: messageDescription?.toString() ?? "",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*You responded with [${options.action.label}] to this message.*`,
            },
          ],
        },
      ],
    });
  }
}
